import request from 'supertest';
import express from 'express';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../config/database', () => ({
  prisma: {
    investment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import { prisma } from '../../config/database';
import investmentsRoutes from './investments.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as unknown as Record<string, unknown>).userId = 'user-1';
  next();
});
app.use('/api/investments', investmentsRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const INVESTMENT = {
  id: 'inv-1',
  name: 'Bancolombia CDT',
  type: 'CDT' as const,
  amountInvested: new Decimal('5000000'),
  currentValue: new Decimal('5250000'),
  currency: 'COP',
  startDate: new Date('2026-01-15T00:00:00.000Z'),
  expectedReturn: new Decimal('12.50'),
  notes: '90-day term',
  userId: 'user-1',
  isActive: true,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-03-01'),
};

const OTHER_USER_INVESTMENT = {
  ...INVESTMENT,
  id: 'inv-other',
  userId: 'user-2',
};

describe('Investments Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/investments', () => {
    it('should return paginated investments', async () => {
      (mockPrisma.investment.findMany as jest.Mock).mockResolvedValue([INVESTMENT]);
      (mockPrisma.investment.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/investments');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by isActive', async () => {
      (mockPrisma.investment.findMany as jest.Mock).mockResolvedValue([INVESTMENT]);
      (mockPrisma.investment.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/investments?isActive=true');

      expect(res.status).toBe(200);
      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by type', async () => {
      (mockPrisma.investment.findMany as jest.Mock).mockResolvedValue([INVESTMENT]);
      (mockPrisma.investment.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/investments?type=CDT');

      expect(res.status).toBe(200);
      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CDT' }),
        }),
      );
    });

    it('should support pagination', async () => {
      (mockPrisma.investment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.investment.count as jest.Mock).mockResolvedValue(25);

      const res = await request(app).get('/api/investments?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(10);
      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should return 422 for invalid type', async () => {
      const res = await request(app).get('/api/investments?type=INVALID');

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/investments/:id', () => {
    it('should return an investment by ID', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(INVESTMENT);

      const res = await request(app).get(`/api/investments/${INVESTMENT.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(INVESTMENT.id);
    });

    it('should return 404 for non-existent investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/investments/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_INVESTMENT,
      );

      const res = await request(app).get(`/api/investments/${OTHER_USER_INVESTMENT.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/investments', () => {
    it('should create an investment', async () => {
      (mockPrisma.investment.create as jest.Mock).mockResolvedValue(INVESTMENT);

      const res = await request(app).post('/api/investments').send({
        name: 'Bancolombia CDT',
        type: 'CDT',
        amountInvested: 5000000,
        currentValue: 5250000,
        startDate: '2026-01-15T00:00:00.000Z',
        expectedReturn: 12.5,
        notes: '90-day term',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 422 for missing required fields', async () => {
      const res = await request(app).post('/api/investments').send({});

      expect(res.status).toBe(422);
    });

    it('should return 422 for short name', async () => {
      const res = await request(app).post('/api/investments').send({
        name: 'A',
        type: 'CDT',
        amountInvested: 5000000,
        currentValue: 5250000,
        startDate: '2026-01-15T00:00:00.000Z',
      });

      expect(res.status).toBe(422);
    });

    it('should return 422 for negative amount', async () => {
      const res = await request(app).post('/api/investments').send({
        name: 'Test Investment',
        type: 'CDT',
        amountInvested: -100,
        currentValue: 5000000,
        startDate: '2026-01-15T00:00:00.000Z',
      });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid type', async () => {
      const res = await request(app).post('/api/investments').send({
        name: 'Test Investment',
        type: 'INVALID',
        amountInvested: 5000000,
        currentValue: 5250000,
        startDate: '2026-01-15T00:00:00.000Z',
      });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid date', async () => {
      const res = await request(app).post('/api/investments').send({
        name: 'Test Investment',
        type: 'CDT',
        amountInvested: 5000000,
        currentValue: 5250000,
        startDate: 'not-a-date',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/investments/:id', () => {
    it('should update an investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(INVESTMENT);
      (mockPrisma.investment.update as jest.Mock).mockResolvedValue({
        ...INVESTMENT,
        currentValue: new Decimal('5500000'),
      });

      const res = await request(app)
        .put(`/api/investments/${INVESTMENT.id}`)
        .send({ currentValue: 5500000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/investments/non-existent')
        .send({ currentValue: 5500000 });

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_INVESTMENT,
      );

      const res = await request(app)
        .put(`/api/investments/${OTHER_USER_INVESTMENT.id}`)
        .send({ currentValue: 5500000 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/investments/:id', () => {
    it('should delete an investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(INVESTMENT);
      (mockPrisma.investment.delete as jest.Mock).mockResolvedValue(INVESTMENT);

      const res = await request(app).delete(`/api/investments/${INVESTMENT.id}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).delete('/api/investments/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user investment', async () => {
      (mockPrisma.investment.findUnique as jest.Mock).mockResolvedValue(
        OTHER_USER_INVESTMENT,
      );

      const res = await request(app).delete(`/api/investments/${OTHER_USER_INVESTMENT.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/investments/summary', () => {
    it('should return investment portfolio summary', async () => {
      const investments = [
        INVESTMENT,
        {
          ...INVESTMENT,
          id: 'inv-2',
          name: 'Bitcoin',
          type: 'CRYPTO' as const,
          amountInvested: new Decimal('3000000'),
          currentValue: new Decimal('3600000'),
        },
      ];
      (mockPrisma.investment.findMany as jest.Mock).mockResolvedValue(investments);

      const res = await request(app).get('/api/investments/summary');

      expect(res.status).toBe(200);
      expect(res.body.data.totalInvested).toBe(8000000);
      expect(res.body.data.totalCurrentValue).toBe(8850000);
      expect(res.body.data.totalReturn).toBe(850000);
      expect(res.body.data.activeInvestments).toBe(2);
      expect(res.body.data.distribution).toHaveLength(2);
    });

    it('should return zeros when no investments', async () => {
      (mockPrisma.investment.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/investments/summary');

      expect(res.status).toBe(200);
      expect(res.body.data.totalInvested).toBe(0);
      expect(res.body.data.totalCurrentValue).toBe(0);
      expect(res.body.data.totalReturn).toBe(0);
      expect(res.body.data.activeInvestments).toBe(0);
      expect(res.body.data.distribution).toHaveLength(0);
    });
  });
});
