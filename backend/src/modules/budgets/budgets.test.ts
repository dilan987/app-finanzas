import request from 'supertest';
import express from 'express';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../config/database', () => ({
  prisma: {
    budget: {
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
      aggregate: jest.fn(),
    },
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import { prisma } from '../../config/database';
import budgetsRoutes from './budgets.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as unknown as Record<string, unknown>).userId = 'user-1';
  next();
});
app.use('/api/budgets', budgetsRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const CATEGORY = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Food',
  icon: 'utensils',
  color: '#EF4444',
  type: 'EXPENSE' as const,
  isDefault: true,
  userId: null,
  createdAt: new Date('2024-01-01'),
};

const BUDGET = {
  id: 'budget-1',
  categoryId: '00000000-0000-0000-0000-000000000001',
  userId: 'user-1',
  amount: new Decimal('500000'),
  month: 3,
  year: 2026,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  category: CATEGORY,
};

const OTHER_USER_BUDGET = {
  ...BUDGET,
  id: 'budget-other',
  userId: 'user-2',
};

describe('Budgets Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/budgets', () => {
    it('should return paginated budgets', async () => {
      (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([BUDGET]);
      (mockPrisma.budget.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/budgets');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by month and year', async () => {
      (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([BUDGET]);
      (mockPrisma.budget.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/budgets?month=3&year=2026');

      expect(res.status).toBe(200);
      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ month: 3, year: 2026 }),
        }),
      );
    });

    it('should support pagination parameters', async () => {
      (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.budget.count as jest.Mock).mockResolvedValue(30);

      const res = await request(app).get('/api/budgets?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(10);
      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should return 422 for invalid month', async () => {
      const res = await request(app).get('/api/budgets?month=13');

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/budgets/:id', () => {
    it('should return a budget by ID', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(BUDGET);

      const res = await request(app).get(`/api/budgets/${BUDGET.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(BUDGET.id);
      expect(res.body.data.category).toBeDefined();
    });

    it('should return 404 for non-existent budget', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/budgets/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user budget', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(OTHER_USER_BUDGET);

      const res = await request(app).get(`/api/budgets/${OTHER_USER_BUDGET.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/budgets', () => {
    it('should create a budget', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(CATEGORY);
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.budget.create as jest.Mock).mockResolvedValue(BUDGET);

      const res = await request(app).post('/api/budgets').send({
        categoryId: '00000000-0000-0000-0000-000000000001',
        amount: 500000,
        month: 3,
        year: 2026,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/budgets').send({
        categoryId: '00000000-0000-0000-0000-000000000000',
        amount: 500000,
        month: 3,
        year: 2026,
      });

      expect(res.status).toBe(404);
    });

    it('should return 409 for duplicate budget', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(CATEGORY);
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(BUDGET);

      const res = await request(app).post('/api/budgets').send({
        categoryId: '00000000-0000-0000-0000-000000000001',
        amount: 500000,
        month: 3,
        year: 2026,
      });

      expect(res.status).toBe(409);
    });

    it('should return 422 for missing required fields', async () => {
      const res = await request(app).post('/api/budgets').send({});

      expect(res.status).toBe(422);
    });

    it('should return 422 for negative amount', async () => {
      const res = await request(app).post('/api/budgets').send({
        categoryId: '00000000-0000-0000-0000-000000000000',
        amount: -100,
        month: 3,
        year: 2026,
      });

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update a budget amount', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(BUDGET);
      (mockPrisma.budget.update as jest.Mock).mockResolvedValue({
        ...BUDGET,
        amount: new Decimal('600000'),
      });

      const res = await request(app)
        .put(`/api/budgets/${BUDGET.id}`)
        .send({ amount: 600000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent budget', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/budgets/non-existent')
        .send({ amount: 600000 });

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user budget', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(OTHER_USER_BUDGET);

      const res = await request(app)
        .put(`/api/budgets/${OTHER_USER_BUDGET.id}`)
        .send({ amount: 600000 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete a budget', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(BUDGET);
      (mockPrisma.budget.delete as jest.Mock).mockResolvedValue(BUDGET);

      const res = await request(app).delete(`/api/budgets/${BUDGET.id}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent budget', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).delete('/api/budgets/non-existent');

      expect(res.status).toBe(404);
    });

    it('should return 404 for another user budget', async () => {
      (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(OTHER_USER_BUDGET);

      const res = await request(app).delete(`/api/budgets/${OTHER_USER_BUDGET.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/budgets/summary', () => {
    it('should return monthly budget summary', async () => {
      (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([BUDGET]);
      (mockPrisma.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: new Decimal('350000') },
      });

      const res = await request(app).get('/api/budgets/summary?month=3&year=2026');

      expect(res.status).toBe(200);
      expect(res.body.data.month).toBe(3);
      expect(res.body.data.year).toBe(2026);
      expect(res.body.data.totalBudget).toBe(500000);
      expect(res.body.data.totalSpent).toBe(350000);
      expect(res.body.data.totalRemaining).toBe(150000);
      expect(res.body.data.budgets).toHaveLength(1);
      expect(res.body.data.budgets[0].percentage).toBe(70);
    });

    it('should return zeros when no budgets', async () => {
      (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/budgets/summary?month=1&year=2026');

      expect(res.status).toBe(200);
      expect(res.body.data.totalBudget).toBe(0);
      expect(res.body.data.totalSpent).toBe(0);
      expect(res.body.data.budgets).toHaveLength(0);
    });

    it('should return 422 for missing month/year', async () => {
      const res = await request(app).get('/api/budgets/summary');

      expect(res.status).toBe(422);
    });
  });
});
