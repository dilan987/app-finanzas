import request from 'supertest';
import express from 'express';

jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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
import onboardingRoutes from './onboarding.routes';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use('/api/onboarding', authMiddleware, onboardingRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const USER_A = 'user-a';
const USER_B = 'user-b';

function token(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

describe('Onboarding Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/onboarding/tour', () => {
    it('returns NOT_STARTED for a fresh user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        tourStatus: 'NOT_STARTED',
        tourVersion: null,
        tourUpdatedAt: null,
      });

      const res = await request(app)
        .get('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        status: 'NOT_STARTED',
        version: null,
        updatedAt: null,
      });
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/onboarding/tour');
      expect(res.status).toBe(401);
    });

    it('returns 404 if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/onboarding/tour', () => {
    it('persists COMPLETED with version', async () => {
      const updatedAt = new Date('2026-04-27T12:00:00Z');
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: USER_A });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        tourStatus: 'COMPLETED',
        tourVersion: '1',
        tourUpdatedAt: updatedAt,
      });

      const res = await request(app)
        .patch('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`)
        .send({ status: 'COMPLETED', version: '1' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.version).toBe('1');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_A },
          data: expect.objectContaining({
            tourStatus: 'COMPLETED',
            tourVersion: '1',
          }),
        }),
      );
    });

    it('persists SKIPPED with version', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: USER_A });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        tourStatus: 'SKIPPED',
        tourVersion: '1',
        tourUpdatedAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`)
        .send({ status: 'SKIPPED', version: '1' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SKIPPED');
    });

    it('forces version=null when status is NOT_STARTED', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: USER_A });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        tourStatus: 'NOT_STARTED',
        tourVersion: null,
        tourUpdatedAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`)
        .send({ status: 'NOT_STARTED', version: '1' });

      expect(res.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tourVersion: null }),
        }),
      );
    });

    it('returns 422 when COMPLETED without version', async () => {
      const res = await request(app)
        .patch('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(422);
    });

    it('returns 422 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`)
        .send({ status: 'BOGUS', version: '1' });

      expect(res.status).toBe(422);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .patch('/api/onboarding/tour')
        .send({ status: 'COMPLETED', version: '1' });
      expect(res.status).toBe(401);
    });

    it('isolates state between users', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.id === USER_A) {
          return Promise.resolve({
            tourStatus: 'COMPLETED',
            tourVersion: '1',
            tourUpdatedAt: new Date(),
          });
        }
        return Promise.resolve({
          tourStatus: 'NOT_STARTED',
          tourVersion: null,
          tourUpdatedAt: null,
        });
      });

      const resA = await request(app)
        .get('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_A)}`);
      const resB = await request(app)
        .get('/api/onboarding/tour')
        .set('Authorization', `Bearer ${token(USER_B)}`);

      expect(resA.body.data.status).toBe('COMPLETED');
      expect(resB.body.data.status).toBe('NOT_STARTED');
    });
  });
});
