import request from 'supertest';
import express from 'express';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../config/database', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    transaction: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    recommendation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import { prisma } from '../../config/database';
import analyticsRoutes from './analytics.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as unknown as Record<string, unknown>).userId = 'user-1';
  next();
});
app.use('/api/analytics', analyticsRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Analytics Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/summary', () => {
    it('should return financial summary for a month', async () => {
      // Current month aggregates
      (mockPrisma.transaction.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('5000000') } }) // current income
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('3000000') } }) // current expenses
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('4500000') } }) // previous income
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('2800000') } }); // previous expenses

      const res = await request(app).get('/api/analytics/summary?month=3&year=2026');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIncome).toBe(5000000);
      expect(res.body.data.totalExpenses).toBe(3000000);
      expect(res.body.data.balance).toBe(2000000);
      expect(res.body.data.savingsRate).toBe(40);
      expect(res.body.data.previousMonth).toBeDefined();
      expect(res.body.data.comparison).toBeDefined();
      expect(res.body.data.comparison.incomeChange).toBeCloseTo(11.11, 1);
    });

    it('should return zeros when no transactions exist', async () => {
      (mockPrisma.transaction.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const res = await request(app).get('/api/analytics/summary?month=1&year=2026');

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(0);
      expect(res.body.data.totalExpenses).toBe(0);
      expect(res.body.data.balance).toBe(0);
      expect(res.body.data.savingsRate).toBe(0);
    });

    it('should return 422 for missing month/year', async () => {
      const res = await request(app).get('/api/analytics/summary');
      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid month', async () => {
      const res = await request(app).get('/api/analytics/summary?month=13&year=2026');
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/analytics/category-breakdown', () => {
    it('should return category breakdown', async () => {
      (mockPrisma.transaction.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { categoryId: 'cat-1', _sum: { amount: new Decimal('1500000') } },
          { categoryId: 'cat-2', _sum: { amount: new Decimal('500000') } },
        ])
        .mockResolvedValueOnce([
          { categoryId: 'cat-1', _sum: { amount: new Decimal('1200000') } },
        ]);

      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Alimentación', icon: 'utensils', color: '#EF4444' },
        { id: 'cat-2', name: 'Transporte', icon: 'car', color: '#3B82F6' },
      ]);

      const res = await request(app).get('/api/analytics/category-breakdown?month=3&year=2026');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].categoryName).toBe('Alimentación');
      expect(res.body.data[0].totalSpent).toBe(1500000);
      expect(res.body.data[0].percentage).toBe(75);
      expect(res.body.data[1].percentage).toBe(25);
    });
  });

  describe('GET /api/analytics/trend', () => {
    it('should return monthly trend', async () => {
      // 6 months x 2 aggregates each (income + expenses)
      for (let i = 0; i < 6; i++) {
        (mockPrisma.transaction.aggregate as jest.Mock)
          .mockResolvedValueOnce({ _sum: { amount: new Decimal('4000000') } })
          .mockResolvedValueOnce({ _sum: { amount: new Decimal('2500000') } });
      }

      const res = await request(app).get('/api/analytics/trend?months=6');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(6);
      expect(res.body.data[0]).toHaveProperty('totalIncome');
      expect(res.body.data[0]).toHaveProperty('totalExpenses');
      expect(res.body.data[0]).toHaveProperty('savingsRate');
    });

    it('should default to 6 months', async () => {
      for (let i = 0; i < 6; i++) {
        (mockPrisma.transaction.aggregate as jest.Mock)
          .mockResolvedValueOnce({ _sum: { amount: null } })
          .mockResolvedValueOnce({ _sum: { amount: null } });
      }

      const res = await request(app).get('/api/analytics/trend');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(6);
    });
  });

  describe('POST /api/analytics/generate-recommendations', () => {
    it('should generate recommendations and return count', async () => {
      (mockPrisma.recommendation.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      // Current month totals (income and expense)
      (mockPrisma.transaction.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('5000000') } })  // income
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('4800000') } }); // expenses

      // Category expenses for rule 1
      (mockPrisma.transaction.groupBy as jest.Mock).mockResolvedValue([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('2000000') } },
      ]);
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Alimentación' },
      ]);

      // Consecutive deficit check (rule 5)
      // Already got current month totals above; for previous months
      for (let i = 0; i < 12; i++) {
        (mockPrisma.transaction.aggregate as jest.Mock)
          .mockResolvedValueOnce({ _sum: { amount: new Decimal('5000000') } })
          .mockResolvedValueOnce({ _sum: { amount: new Decimal('3000000') } });
      }

      // Recurring transactions (rule 6)
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      // Budgets (rule 7)
      (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      (mockPrisma.recommendation.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const res = await request(app).post('/api/analytics/generate-recommendations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.generated).toBeGreaterThanOrEqual(0);
      expect(mockPrisma.recommendation.deleteMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/recommendations', () => {
    it('should return all recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          userId: 'user-1',
          message: 'Tu tasa de ahorro es del 5%. Se recomienda mínimo un 20%.',
          severity: 'CRITICAL',
          category: 'ahorro',
          isRead: false,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.recommendation.findMany as jest.Mock).mockResolvedValue(mockRecommendations);

      const res = await request(app).get('/api/analytics/recommendations');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].severity).toBe('CRITICAL');
    });

    it('should filter unread only', async () => {
      (mockPrisma.recommendation.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/analytics/recommendations?unreadOnly=true');

      expect(res.status).toBe(200);
      expect(mockPrisma.recommendation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isRead: false }),
        }),
      );
    });
  });

  describe('PATCH /api/analytics/recommendations/:id/read', () => {
    it('should mark recommendation as read', async () => {
      const mockRec = {
        id: '00000000-0000-0000-0000-000000000001',
        userId: 'user-1',
        message: 'Test',
        severity: 'INFO',
        category: 'test',
        isRead: false,
        createdAt: new Date(),
      };
      (mockPrisma.recommendation.findUnique as jest.Mock).mockResolvedValue(mockRec);
      (mockPrisma.recommendation.update as jest.Mock).mockResolvedValue({
        ...mockRec,
        isRead: true,
      });

      const res = await request(app).patch(
        `/api/analytics/recommendations/${mockRec.id}/read`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it('should return 404 for non-existent recommendation', async () => {
      (mockPrisma.recommendation.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).patch(
        '/api/analytics/recommendations/00000000-0000-0000-0000-000000000099/read',
      );

      expect(res.status).toBe(404);
    });

    it('should return 403 for another user recommendation', async () => {
      (mockPrisma.recommendation.findUnique as jest.Mock).mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000001',
        userId: 'user-2',
        message: 'Test',
        severity: 'INFO',
        category: 'test',
        isRead: false,
        createdAt: new Date(),
      });

      const res = await request(app).patch(
        '/api/analytics/recommendations/00000000-0000-0000-0000-000000000001/read',
      );

      expect(res.status).toBe(403);
    });
  });
});
