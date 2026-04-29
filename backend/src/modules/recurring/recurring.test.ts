import request from 'supertest';
import express from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import type { Frequency } from '@prisma/client';

const mockTransaction = jest.fn();

jest.mock('../../config/database', () => ({
  prisma: {
    recurringTransaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: mockTransaction,
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import { prisma } from '../../config/database';
import recurringRoutes from './recurring.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as unknown as Record<string, unknown>).userId = 'user-1';
  next();
});
app.use('/api/recurring', recurringRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const CATEGORY = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Subscriptions',
  icon: 'tv',
  color: '#8B5CF6',
  type: 'EXPENSE' as const,
  isDefault: true,
  userId: null,
  createdAt: new Date('2024-01-01'),
};

const RECURRING = {
  id: 'rec-1',
  type: 'EXPENSE' as const,
  amount: new Decimal('80000'),
  description: 'Netflix subscription',
  categoryId: '00000000-0000-0000-0000-000000000001',
  userId: 'user-1',
  frequency: 'MONTHLY' as Frequency,
  nextExecutionDate: new Date('2026-04-01T00:00:00.000Z'),
  isActive: true,
  paymentMethod: 'CREDIT_CARD' as const,
  currency: 'COP',
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  category: CATEGORY,
};

const OTHER_USER_RECURRING = {
  ...RECURRING,
  id: 'rec-other',
  userId: 'user-2',
};

describe('Recurring Transactions Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/recurring', () => {
    it('should return paginated recurring transactions', async () => {
      (mockPrisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([RECURRING]);
      (mockPrisma.recurringTransaction.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/recurring');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by isActive', async () => {
      (mockPrisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([RECURRING]);
      (mockPrisma.recurringTransaction.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/recurring?isActive=true');

      expect(res.status).toBe(200);
      expect(mockPrisma.recurringTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by type', async () => {
      (mockPrisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([RECURRING]);
      (mockPrisma.recurringTransaction.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/recurring?type=EXPENSE');

      expect(res.status).toBe(200);
      expect(mockPrisma.recurringTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'EXPENSE' }),
        }),
      );
    });

    it('should return 422 for invalid type', async () => {
      const res = await request(app).get('/api/recurring?type=INVALID');

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/recurring/:id', () => {
    it('should return a recurring transaction by ID', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(RECURRING);

      const res = await request(app).get(`/api/recurring/${RECURRING.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(RECURRING.id);
      expect(res.body.data.category).toBeDefined();
    });

    it('should return 404 for non-existent recurring', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/recurring/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user recurring', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_RECURRING,
      );

      const res = await request(app).get(`/api/recurring/${OTHER_USER_RECURRING.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/recurring', () => {
    it('should create a recurring transaction', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(CATEGORY);
      (mockPrisma.recurringTransaction.create as jest.Mock).mockResolvedValue(RECURRING);

      const res = await request(app).post('/api/recurring').send({
        type: 'EXPENSE',
        amount: 80000,
        description: 'Netflix subscription',
        categoryId: '00000000-0000-0000-0000-000000000001',
        frequency: 'MONTHLY',
        nextExecutionDate: '2026-04-01T00:00:00.000Z',
        paymentMethod: 'CREDIT_CARD',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/recurring').send({
        type: 'EXPENSE',
        amount: 80000,
        categoryId: '00000000-0000-0000-0000-000000000000',
        frequency: 'MONTHLY',
        nextExecutionDate: '2026-04-01T00:00:00.000Z',
        paymentMethod: 'CREDIT_CARD',
      });

      expect(res.status).toBe(404);
    });

    it('should return 422 for missing required fields', async () => {
      const res = await request(app).post('/api/recurring').send({});

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid frequency', async () => {
      const res = await request(app).post('/api/recurring').send({
        type: 'EXPENSE',
        amount: 80000,
        categoryId: '00000000-0000-0000-0000-000000000000',
        frequency: 'INVALID',
        nextExecutionDate: '2026-04-01T00:00:00.000Z',
        paymentMethod: 'CREDIT_CARD',
      });

      expect(res.status).toBe(422);
    });

    it('should return 422 for negative amount', async () => {
      const res = await request(app).post('/api/recurring').send({
        type: 'EXPENSE',
        amount: -100,
        categoryId: '00000000-0000-0000-0000-000000000000',
        frequency: 'MONTHLY',
        nextExecutionDate: '2026-04-01T00:00:00.000Z',
        paymentMethod: 'CREDIT_CARD',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/recurring/:id', () => {
    it('should update a recurring transaction', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(RECURRING);
      (mockPrisma.recurringTransaction.update as jest.Mock).mockResolvedValue({
        ...RECURRING,
        amount: new Decimal('100000'),
      });

      const res = await request(app)
        .put(`/api/recurring/${RECURRING.id}`)
        .send({ amount: 100000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent recurring', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/recurring/non-existent')
        .send({ amount: 100000 });

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user recurring', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_RECURRING,
      );

      const res = await request(app)
        .put(`/api/recurring/${OTHER_USER_RECURRING.id}`)
        .send({ amount: 100000 });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/recurring/:id/toggle', () => {
    it('should pause a recurring transaction', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(RECURRING);
      (mockPrisma.recurringTransaction.update as jest.Mock).mockResolvedValue({
        ...RECURRING,
        isActive: false,
      });

      const res = await request(app)
        .patch(`/api/recurring/${RECURRING.id}/toggle`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('paused');
    });

    it('should resume a recurring transaction', async () => {
      const paused = { ...RECURRING, isActive: false };
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(paused);
      (mockPrisma.recurringTransaction.update as jest.Mock).mockResolvedValue({
        ...paused,
        isActive: true,
      });

      const res = await request(app)
        .patch(`/api/recurring/${RECURRING.id}/toggle`)
        .send({ isActive: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('activated');
    });

    it('should return 404 for non-existent recurring', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/recurring/non-existent/toggle')
        .send({ isActive: false });

      expect(res.status).toBe(404);
    });

    it('should return 422 for missing isActive', async () => {
      const res = await request(app)
        .patch(`/api/recurring/${RECURRING.id}/toggle`)
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/recurring/:id', () => {
    it('should delete a recurring transaction', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(RECURRING);
      (mockPrisma.recurringTransaction.delete as jest.Mock).mockResolvedValue(RECURRING);

      const res = await request(app).delete(`/api/recurring/${RECURRING.id}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent recurring', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).delete('/api/recurring/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user recurring', async () => {
      (mockPrisma.recurringTransaction.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_RECURRING,
      );

      const res = await request(app).delete(`/api/recurring/${OTHER_USER_RECURRING.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/recurring/process', () => {
    it('should process due recurring transactions', async () => {
      const dueRecurring = {
        ...RECURRING,
        nextExecutionDate: new Date('2026-03-01T00:00:00.000Z'),
      };
      (mockPrisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([dueRecurring]);
      mockTransaction.mockImplementation(async (fn: (tx: Record<string, unknown>) => Promise<void>) => {
        await fn({
          transaction: { create: jest.fn() },
          recurringTransaction: { update: jest.fn() },
        });
      });

      const res = await request(app).post('/api/recurring/process');

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.processed).toBe(1);
      expect(res.body.data.errors).toBe(0);
    });

    it('should return empty results when no due transactions', async () => {
      (mockPrisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).post('/api/recurring/process');

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.processed).toBe(0);
    });

    it('should deactivate a ONCE movement after execution and not advance next date', async () => {
      const onceRec = {
        ...RECURRING,
        id: 'rec-once',
        frequency: 'ONCE' as const,
        nextExecutionDate: new Date('2026-03-15T00:00:00.000Z'),
      };
      (mockPrisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([onceRec]);

      let txCreateCalled = false;
      let recurringUpdateArgs: Record<string, unknown> | null = null;

      mockTransaction.mockImplementation(async (fn: (tx: Record<string, unknown>) => Promise<void>) => {
        await fn({
          transaction: {
            create: jest.fn().mockImplementation(() => {
              txCreateCalled = true;
              return Promise.resolve({});
            }),
          },
          recurringTransaction: {
            update: jest.fn().mockImplementation((args: Record<string, unknown>) => {
              recurringUpdateArgs = args;
              return Promise.resolve({});
            }),
          },
          account: { update: jest.fn() },
        });
      });

      const res = await request(app).post('/api/recurring/process');

      expect(res.status).toBe(200);
      expect(res.body.data.processed).toBe(1);
      expect(txCreateCalled).toBe(true);
      expect(recurringUpdateArgs).not.toBeNull();
      const data = (recurringUpdateArgs as unknown as { data: Record<string, unknown> }).data;
      expect(data.isActive).toBe(false);
      expect(data.nextExecutionDate).toBeUndefined();
    });

    it('should advance next date for repeating frequency (no regression)', async () => {
      const monthlyRec = {
        ...RECURRING,
        id: 'rec-monthly',
        nextExecutionDate: new Date('2026-03-01T00:00:00.000Z'),
      };
      (mockPrisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([monthlyRec]);

      let recurringUpdateArgs: Record<string, unknown> | null = null;
      mockTransaction.mockImplementation(async (fn: (tx: Record<string, unknown>) => Promise<void>) => {
        await fn({
          transaction: { create: jest.fn() },
          recurringTransaction: {
            update: jest.fn().mockImplementation((args: Record<string, unknown>) => {
              recurringUpdateArgs = args;
              return Promise.resolve({});
            }),
          },
          account: { update: jest.fn() },
        });
      });

      const res = await request(app).post('/api/recurring/process');
      expect(res.status).toBe(200);
      const data = (recurringUpdateArgs as unknown as { data: Record<string, unknown> }).data;
      expect(data.nextExecutionDate).toBeDefined();
      expect(data.isActive).toBeUndefined();
    });
  });

  describe('POST /api/recurring (ONCE creation)', () => {
    it('should accept frequency ONCE on create', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(CATEGORY);
      (mockPrisma.recurringTransaction.create as jest.Mock).mockResolvedValue({
        ...RECURRING,
        frequency: 'ONCE',
      });

      const res = await request(app).post('/api/recurring').send({
        type: 'EXPENSE',
        amount: 300000,
        description: 'Cumpleaños mamá',
        categoryId: '00000000-0000-0000-0000-000000000001',
        frequency: 'ONCE',
        nextExecutionDate: '2026-05-23T00:00:00.000Z',
        paymentMethod: 'CASH',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.frequency).toBe('ONCE');
    });
  });

});
