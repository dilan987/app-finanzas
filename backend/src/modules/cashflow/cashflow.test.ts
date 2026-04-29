import request from 'supertest';
import express from 'express';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../config/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    transaction: { findMany: jest.fn() },
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    NODE_ENV: 'test',
  },
}));

import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import cashflowRoutes from './cashflow.routes';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use('/api/cashflow', authMiddleware, cashflowRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const USER_A = 'user-a';
const USER_B = 'user-b';

function token(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function makeTx(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'tx-1',
    type: 'EXPENSE',
    amount: new Decimal('100000'),
    description: 'Mercado',
    date: new Date('2026-05-05T00:00:00.000Z'),
    paymentMethod: 'CASH',
    currency: 'COP',
    categoryId: null,
    userId: USER_A,
    recurringId: null,
    accountId: null,
    transferAccountId: null,
    goalId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: null,
    account: null,
    ...overrides,
  };
}

describe('Cashflow Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cashflow/biweekly', () => {
    it('default calendar mode places day 5 in Q1 and day 20 in Q2', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        biweeklyCustomEnabled: false,
        biweeklyStartDay1: null,
        biweeklyStartDay2: null,
      });
      (mockPrisma.transaction.findMany as jest.Mock).mockImplementation((args: { where: { date: { gte: Date; lte: Date } } }) => {
        const startDay = args.where.date.gte.getUTCDate();
        if (startDay === 1) {
          return Promise.resolve([makeTx({ id: 'tx-q1', date: new Date('2026-05-05T00:00:00.000Z') })]);
        }
        return Promise.resolve([
          makeTx({ id: 'tx-q2', date: new Date('2026-05-20T00:00:00.000Z'), amount: new Decimal('50000') }),
        ]);
      });

      const res = await request(app)
        .get('/api/cashflow/biweekly?month=5&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mode).toBe('calendar');
      expect(res.body.data.buckets[0].entries).toHaveLength(1);
      expect(res.body.data.buckets[0].entries[0].id).toBe('tx-q1');
      expect(res.body.data.buckets[1].entries).toHaveLength(1);
      expect(res.body.data.buckets[1].entries[0].id).toBe('tx-q2');
    });

    it('custom mode 30/15 wraps around month boundary', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        biweeklyCustomEnabled: true,
        biweeklyStartDay1: 30,
        biweeklyStartDay2: 15,
      });
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/cashflow/biweekly?month=5&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mode).toBe('custom');
      expect(res.body.data.buckets[0].rangeStart).toContain('2026-04-30');
      expect(res.body.data.buckets[0].rangeEnd).toContain('2026-05-14');
      expect(res.body.data.buckets[1].rangeStart).toContain('2026-05-15');
      expect(res.body.data.buckets[1].rangeEnd).toContain('2026-05-29');
    });

    it('custom 30/15 in February clamps end of Q2 to last day', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        biweeklyCustomEnabled: true,
        biweeklyStartDay1: 30,
        biweeklyStartDay2: 15,
      });
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/cashflow/biweekly?month=2&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.buckets[1].rangeEnd).toContain('2026-02-28');
    });

    it('returns empty buckets when no transactions', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        biweeklyCustomEnabled: false,
        biweeklyStartDay1: null,
        biweeklyStartDay2: null,
      });
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/cashflow/biweekly?month=5&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.monthTotals.netBalance).toBe(0);
      expect(res.body.data.buckets[0].entries).toHaveLength(0);
      expect(res.body.data.buckets[1].entries).toHaveLength(0);
    });

    it('TRANSFER is listed but excluded from totals', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        biweeklyCustomEnabled: false,
        biweeklyStartDay1: null,
        biweeklyStartDay2: null,
      });
      (mockPrisma.transaction.findMany as jest.Mock).mockImplementation((args: { where: { date: { gte: Date } } }) => {
        const startDay = args.where.date.gte.getUTCDate();
        if (startDay === 1) {
          return Promise.resolve([
            makeTx({ id: 'tx-i', type: 'INCOME', amount: new Decimal('1000'), date: new Date('2026-05-05T00:00:00.000Z') }),
            makeTx({ id: 'tx-t', type: 'TRANSFER', amount: new Decimal('500'), date: new Date('2026-05-08T00:00:00.000Z') }),
          ]);
        }
        return Promise.resolve([]);
      });

      const res = await request(app)
        .get('/api/cashflow/biweekly?month=5&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.body.data.buckets[0].entries).toHaveLength(2);
      expect(res.body.data.buckets[0].totalIncome).toBe(1000);
      expect(res.body.data.buckets[0].totalExpense).toBe(0);
      expect(res.body.data.buckets[0].netBalance).toBe(1000);
    });

    it('returns 422 for invalid month', async () => {
      const res = await request(app)
        .get('/api/cashflow/biweekly?month=13&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);
      expect(res.status).toBe(422);
    });

    it('returns 422 when missing year', async () => {
      const res = await request(app)
        .get('/api/cashflow/biweekly?month=5')
        .set('Authorization', `Bearer ${token(USER_A)}`);
      expect(res.status).toBe(422);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/cashflow/biweekly?month=5&year=2026');
      expect(res.status).toBe(401);
    });

    it('isolates state between users', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === USER_A) return Promise.resolve({ biweeklyCustomEnabled: true, biweeklyStartDay1: 30, biweeklyStartDay2: 15 });
        return Promise.resolve({ biweeklyCustomEnabled: false, biweeklyStartDay1: null, biweeklyStartDay2: null });
      });
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const resA = await request(app)
        .get('/api/cashflow/biweekly?month=5&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);
      const resB = await request(app)
        .get('/api/cashflow/biweekly?month=5&year=2026')
        .set('Authorization', `Bearer ${token(USER_B)}`);

      expect(resA.body.data.mode).toBe('custom');
      expect(resB.body.data.mode).toBe('calendar');
    });

    it('returns rangeLabel in spanish short form', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        biweeklyCustomEnabled: true,
        biweeklyStartDay1: 30,
        biweeklyStartDay2: 15,
      });
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/cashflow/biweekly?month=5&year=2026')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.body.data.buckets[0].rangeLabel).toContain('30 abr');
      expect(res.body.data.buckets[0].rangeLabel).toContain('14 may');
    });
  });
});
