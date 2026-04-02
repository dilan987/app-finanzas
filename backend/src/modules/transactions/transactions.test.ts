import request from 'supertest';
import express from 'express';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../config/database', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import { prisma } from '../../config/database';
import transactionsRoutes from './transactions.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as Record<string, unknown>).userId = 'user-1';
  next();
});
app.use('/api/transactions', transactionsRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const CATEGORY = {
  id: 'cat-1',
  name: 'Food',
  icon: 'utensils',
  color: '#EF4444',
  type: 'EXPENSE' as const,
  isDefault: true,
  userId: null,
  createdAt: new Date('2024-01-01'),
};

const TRANSACTION = {
  id: 'txn-1',
  type: 'EXPENSE' as const,
  amount: new Decimal('150000'),
  description: 'Grocery shopping',
  date: new Date('2026-03-15T12:00:00.000Z'),
  paymentMethod: 'DEBIT_CARD' as const,
  currency: 'COP',
  categoryId: 'cat-1',
  userId: 'user-1',
  recurringId: null,
  createdAt: new Date('2026-03-15T12:00:00.000Z'),
  updatedAt: new Date('2026-03-15T12:00:00.000Z'),
  category: CATEGORY,
};

const OTHER_USER_TRANSACTION = {
  ...TRANSACTION,
  id: 'txn-other',
  userId: 'user-2',
};

describe('Transactions Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions', () => {
    it('should return paginated transactions', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([TRANSACTION]);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/transactions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it('should filter by type', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([TRANSACTION]);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/transactions?type=EXPENSE');

      expect(res.status).toBe(200);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'EXPENSE' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get(
        '/api/transactions?startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-31T23:59:59.999Z',
      );

      expect(res.status).toBe(200);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should support text search', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([TRANSACTION]);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/transactions?search=grocery');

      expect(res.status).toBe(200);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: { contains: 'grocery', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should support pagination parameters', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(50);

      const res = await request(app).get('/api/transactions?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.totalPages).toBe(5);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should support amount range filter', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get(
        '/api/transactions?minAmount=100000&maxAmount=500000',
      );

      expect(res.status).toBe(200);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            amount: { gte: 100000, lte: 500000 },
          }),
        }),
      );
    });

    it('should return 422 for invalid type', async () => {
      const res = await request(app).get('/api/transactions?type=INVALID');

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should return a transaction by ID', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(TRANSACTION);

      const res = await request(app).get(`/api/transactions/${TRANSACTION.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(TRANSACTION.id);
      expect(res.body.data.category).toBeDefined();
    });

    it('should return 404 for non-existent transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/transactions/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_TRANSACTION,
      );

      const res = await request(app).get(
        `/api/transactions/${OTHER_USER_TRANSACTION.id}`,
      );

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a transaction', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(CATEGORY);
      (mockPrisma.transaction.create as jest.Mock).mockResolvedValue(TRANSACTION);

      const res = await request(app).post('/api/transactions').send({
        type: 'EXPENSE',
        amount: 150000,
        description: 'Grocery shopping',
        date: '2026-03-15T12:00:00.000Z',
        paymentMethod: 'DEBIT_CARD',
        categoryId: 'cat-1',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBeDefined();
    });

    it('should return 404 for non-existent category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/transactions').send({
        type: 'EXPENSE',
        amount: 150000,
        date: '2026-03-15T12:00:00.000Z',
        paymentMethod: 'CASH',
        categoryId: '00000000-0000-0000-0000-000000000000',
      });

      expect(res.status).toBe(404);
    });

    it('should return 422 for missing required fields', async () => {
      const res = await request(app).post('/api/transactions').send({});

      expect(res.status).toBe(422);
    });

    it('should return 422 for negative amount', async () => {
      const res = await request(app).post('/api/transactions').send({
        type: 'EXPENSE',
        amount: -100,
        date: '2026-03-15T12:00:00.000Z',
        paymentMethod: 'CASH',
        categoryId: '00000000-0000-0000-0000-000000000000',
      });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid date format', async () => {
      const res = await request(app).post('/api/transactions').send({
        type: 'EXPENSE',
        amount: 100,
        date: 'not-a-date',
        paymentMethod: 'CASH',
        categoryId: '00000000-0000-0000-0000-000000000000',
      });

      expect(res.status).toBe(422);
    });

    it('should return 403 for inaccessible category', async () => {
      const otherUserCategory = {
        ...CATEGORY,
        isDefault: false,
        userId: 'user-2',
      };
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(
        otherUserCategory,
      );

      const res = await request(app).post('/api/transactions').send({
        type: 'EXPENSE',
        amount: 150000,
        date: '2026-03-15T12:00:00.000Z',
        paymentMethod: 'CASH',
        categoryId: otherUserCategory.id,
      });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update a transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(TRANSACTION);
      (mockPrisma.transaction.update as jest.Mock).mockResolvedValue({
        ...TRANSACTION,
        amount: new Decimal('200000'),
      });

      const res = await request(app)
        .put(`/api/transactions/${TRANSACTION.id}`)
        .send({ amount: 200000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/transactions/non-existent')
        .send({ amount: 200000 });

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_TRANSACTION,
      );

      const res = await request(app)
        .put(`/api/transactions/${OTHER_USER_TRANSACTION.id}`)
        .send({ amount: 200000 });

      expect(res.status).toBe(404);
    });

    it('should verify new category when updating categoryId', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(TRANSACTION);
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/transactions/${TRANSACTION.id}`)
        .send({ categoryId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(TRANSACTION);
      (mockPrisma.transaction.delete as jest.Mock).mockResolvedValue(TRANSACTION);

      const res = await request(app).delete(`/api/transactions/${TRANSACTION.id}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).delete('/api/transactions/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user transaction', async () => {
      (mockPrisma.transaction.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_TRANSACTION,
      );

      const res = await request(app).delete(
        `/api/transactions/${OTHER_USER_TRANSACTION.id}`,
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/transactions/stats/monthly', () => {
    it('should return monthly stats', async () => {
      (mockPrisma.transaction.aggregate as jest.Mock)
        .mockResolvedValueOnce({
          _sum: { amount: new Decimal('5000000') },
          _count: 10,
        })
        .mockResolvedValueOnce({
          _sum: { amount: new Decimal('3200000') },
          _count: 25,
        });

      const res = await request(app).get(
        '/api/transactions/stats/monthly?month=3&year=2026',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(5000000);
      expect(res.body.data.totalExpense).toBe(3200000);
      expect(res.body.data.balance).toBe(1800000);
      expect(res.body.data.transactionCount).toBe(35);
    });

    it('should return zeros when no transactions', async () => {
      (mockPrisma.transaction.aggregate as jest.Mock)
        .mockResolvedValueOnce({
          _sum: { amount: null },
          _count: 0,
        })
        .mockResolvedValueOnce({
          _sum: { amount: null },
          _count: 0,
        });

      const res = await request(app).get(
        '/api/transactions/stats/monthly?month=1&year=2026',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(0);
      expect(res.body.data.totalExpense).toBe(0);
      expect(res.body.data.balance).toBe(0);
      expect(res.body.data.transactionCount).toBe(0);
    });

    it('should return 422 for missing month/year', async () => {
      const res = await request(app).get('/api/transactions/stats/monthly');

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid month', async () => {
      const res = await request(app).get(
        '/api/transactions/stats/monthly?month=13&year=2026',
      );

      expect(res.status).toBe(422);
    });
  });
});
