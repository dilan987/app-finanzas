import request from 'supertest';
import express from 'express';

jest.mock('../../config/database', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
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
import categoriesRoutes from './categories.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

// Simulate authMiddleware by injecting userId
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as Record<string, unknown>).userId = 'user-1';
  next();
});
app.use('/api/categories', categoriesRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const DEFAULT_CATEGORY = {
  id: 'cat-default-1',
  name: 'Salary',
  icon: 'briefcase',
  color: '#10B981',
  type: 'INCOME' as const,
  isDefault: true,
  userId: null,
  createdAt: new Date('2024-01-01'),
};

const USER_CATEGORY = {
  id: 'cat-user-1',
  name: 'Freelance',
  icon: 'laptop',
  color: '#3B82F6',
  type: 'INCOME' as const,
  isDefault: false,
  userId: 'user-1',
  createdAt: new Date('2024-06-01'),
};

const OTHER_USER_CATEGORY = {
  id: 'cat-other-1',
  name: 'Other Category',
  icon: 'tag',
  color: '#6B7280',
  type: 'EXPENSE' as const,
  isDefault: false,
  userId: 'user-2',
  createdAt: new Date('2024-06-01'),
};

describe('Categories Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all accessible categories', async () => {
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([
        DEFAULT_CATEGORY,
        USER_CATEGORY,
      ]);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should filter by type', async () => {
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([DEFAULT_CATEGORY]);

      const res = await request(app).get('/api/categories?type=INCOME');

      expect(res.status).toBe(200);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'INCOME' }),
        }),
      );
    });

    it('should return 422 for invalid type', async () => {
      const res = await request(app).get('/api/categories?type=INVALID');

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a default category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(DEFAULT_CATEGORY);

      const res = await request(app).get(`/api/categories/${DEFAULT_CATEGORY.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Salary');
    });

    it('should return a user-owned category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(USER_CATEGORY);

      const res = await request(app).get(`/api/categories/${USER_CATEGORY.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Freelance');
    });

    it('should return 404 for another user category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(OTHER_USER_CATEGORY);

      const res = await request(app).get(`/api/categories/${OTHER_USER_CATEGORY.id}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/categories/non-existent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should create a custom category', async () => {
      const newCategory = {
        ...USER_CATEGORY,
        id: 'cat-new-1',
        name: 'Side Project',
      };
      (mockPrisma.category.create as jest.Mock).mockResolvedValue(newCategory);

      const res = await request(app).post('/api/categories').send({
        name: 'Side Project',
        icon: 'laptop',
        color: '#3B82F6',
        type: 'INCOME',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Side Project');
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          isDefault: false,
        }),
      });
    });

    it('should return 422 for missing required fields', async () => {
      const res = await request(app).post('/api/categories').send({});

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid color format', async () => {
      const res = await request(app).post('/api/categories').send({
        name: 'Test',
        color: 'not-a-color',
        type: 'INCOME',
      });

      expect(res.status).toBe(422);
    });

    it('should return 422 for name too short', async () => {
      const res = await request(app).post('/api/categories').send({
        name: 'A',
        type: 'INCOME',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a user-owned category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(USER_CATEGORY);
      (mockPrisma.category.update as jest.Mock).mockResolvedValue({
        ...USER_CATEGORY,
        name: 'Updated Name',
      });

      const res = await request(app)
        .put(`/api/categories/${USER_CATEGORY.id}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should return 403 for default category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(DEFAULT_CATEGORY);

      const res = await request(app)
        .put(`/api/categories/${DEFAULT_CATEGORY.id}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for another user category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(OTHER_USER_CATEGORY);

      const res = await request(app)
        .put(`/api/categories/${OTHER_USER_CATEGORY.id}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a user-owned category with no transactions', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(USER_CATEGORY);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.category.delete as jest.Mock).mockResolvedValue(USER_CATEGORY);

      const res = await request(app).delete(`/api/categories/${USER_CATEGORY.id}`);

      expect(res.status).toBe(204);
    });

    it('should return 409 if category has transactions', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(USER_CATEGORY);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(5);

      const res = await request(app).delete(`/api/categories/${USER_CATEGORY.id}`);

      expect(res.status).toBe(409);
    });

    it('should return 403 for default category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(DEFAULT_CATEGORY);

      const res = await request(app).delete(`/api/categories/${DEFAULT_CATEGORY.id}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent category', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).delete('/api/categories/non-existent');

      expect(res.status).toBe(404);
    });
  });
});
