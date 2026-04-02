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
    },
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import { prisma } from '../../config/database';
import reportsRoutes from './reports.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as unknown as Record<string, unknown>).userId = 'user-1';
  next();
});
app.use('/api/reports', reportsRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const CATEGORY = {
  id: 'cat-1',
  name: 'Alimentación',
  icon: 'utensils',
  color: '#EF4444',
  type: 'EXPENSE' as const,
  isDefault: true,
  userId: null,
  createdAt: new Date('2024-01-01'),
};

describe('Reports Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/pdf', () => {
    it('should generate and return a PDF', async () => {
      (mockPrisma.transaction.aggregate as jest.Mock)
        .mockResolvedValueOnce({
          _sum: { amount: new Decimal('5000000') },
          _count: 10,
        })
        .mockResolvedValueOnce({
          _sum: { amount: new Decimal('3200000') },
          _count: 25,
        });

      (mockPrisma.transaction.groupBy as jest.Mock).mockResolvedValue([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('1500000') } },
      ]);

      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([CATEGORY]);

      const res = await request(app).get('/api/reports/pdf?month=3&year=2026');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('reporte_Marzo_2026.pdf');
      expect(res.body).toBeInstanceOf(Buffer);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 422 for missing month', async () => {
      const res = await request(app).get('/api/reports/pdf?year=2026');
      expect(res.status).toBe(422);
    });

    it('should return 422 for missing year', async () => {
      const res = await request(app).get('/api/reports/pdf?month=3');
      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid month', async () => {
      const res = await request(app).get('/api/reports/pdf?month=13&year=2026');
      expect(res.status).toBe(422);
    });

    it('should handle months with no transactions', async () => {
      (mockPrisma.transaction.aggregate as jest.Mock)
        .mockResolvedValueOnce({
          _sum: { amount: null },
          _count: 0,
        })
        .mockResolvedValueOnce({
          _sum: { amount: null },
          _count: 0,
        });

      (mockPrisma.transaction.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/reports/pdf?month=1&year=2026');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/reports/csv', () => {
    it('should generate and return a CSV', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'txn-1',
          type: 'EXPENSE',
          amount: new Decimal('150000'),
          description: 'Compras supermercado',
          date: new Date('2026-03-15T12:00:00.000Z'),
          paymentMethod: 'DEBIT_CARD',
          currency: 'COP',
          categoryId: 'cat-1',
          userId: 'user-1',
          recurringId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: CATEGORY,
        },
      ]);

      const res = await request(app).get('/api/reports/csv');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('transacciones_');
      expect(res.headers['content-disposition']).toContain('.csv');

      const body = res.text;
      expect(body).toContain('Fecha,Tipo,Categoría,Descripción,Monto,Método de Pago,Moneda');
      expect(body).toContain('Gasto');
      expect(body).toContain('Alimentación');
      expect(body).toContain('150000');
      expect(body).toContain('Tarjeta Débito');
    });

    it('should filter by type', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/reports/csv?type=INCOME');

      expect(res.status).toBe(200);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'INCOME' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get(
        '/api/reports/csv?startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-31T23:59:59.999Z',
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

    it('should return empty CSV with just header when no transactions', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/reports/csv');

      expect(res.status).toBe(200);
      const body = res.text;
      // BOM + header
      expect(body).toContain('Fecha,Tipo,Categoría,Descripción,Monto,Método de Pago,Moneda');
      // Only the header line after removing BOM
      const lines = body.replace('\uFEFF', '').split('\n').filter((l: string) => l.trim());
      expect(lines).toHaveLength(1);
    });

    it('should return 422 for invalid type', async () => {
      const res = await request(app).get('/api/reports/csv?type=INVALID');
      expect(res.status).toBe(422);
    });

    it('should escape CSV fields with commas', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'txn-2',
          type: 'EXPENSE',
          amount: new Decimal('50000'),
          description: 'Compra con coma, en descripción',
          date: new Date('2026-03-20T12:00:00.000Z'),
          paymentMethod: 'CASH',
          currency: 'COP',
          categoryId: 'cat-1',
          userId: 'user-1',
          recurringId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: CATEGORY,
        },
      ]);

      const res = await request(app).get('/api/reports/csv');

      expect(res.status).toBe(200);
      expect(res.text).toContain('"Compra con coma, en descripción"');
    });
  });
});
