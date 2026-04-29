import request from 'supertest';
import bcrypt from 'bcrypt';
import express from 'express';

// Mock dependencies before importing modules
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

jest.mock('bcrypt');

import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import usersRoutes from './users.routes';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use('/api/users', authMiddleware, usersRoutes);
app.use(errorMiddleware);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const TEST_USER = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  name: 'Test User',
  mainCurrency: 'COP',
  timezone: 'America/Bogota',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const TEST_USER_PROFILE = {
  id: TEST_USER.id,
  email: TEST_USER.email,
  name: TEST_USER.name,
  mainCurrency: TEST_USER.mainCurrency,
  timezone: TEST_USER.timezone,
  createdAt: TEST_USER.createdAt,
  updatedAt: TEST_USER.updatedAt,
};

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

describe('Users Module', () => {
  let accessToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    accessToken = generateAccessToken(TEST_USER.id);
  });

  describe('GET /api/users/profile', () => {
    it('should return the user profile', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER_PROFILE);

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(TEST_USER.email);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/users/profile');

      expect(res.status).toBe(401);
    });

    it('should return 404 if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update the user profile', async () => {
      const updatedProfile = { ...TEST_USER_PROFILE, name: 'Updated Name' };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedProfile);

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should return 422 for invalid name', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'A' });

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change password with valid current password', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(TEST_USER);

      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'OldP@ssw0rd',
          newPassword: 'NewP@ssw0rd',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 for wrong current password', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongP@ss1',
          newPassword: 'NewP@ssw0rd',
        });

      expect(res.status).toBe(401);
    });

    it('should return 422 for weak new password', async () => {
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'OldP@ssw0rd',
          newPassword: 'weak',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/users/profile (biweekly config)', () => {
    it('should accept enabling custom with valid days 30/15', async () => {
      const updated = {
        ...TEST_USER_PROFILE,
        biweeklyCustomEnabled: true,
        biweeklyStartDay1: 30,
        biweeklyStartDay2: 15,
      };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          biweeklyCustomEnabled: true,
          biweeklyStartDay1: 30,
          biweeklyStartDay2: 15,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.biweeklyCustomEnabled).toBe(true);
      expect(res.body.data.biweeklyStartDay1).toBe(30);
      expect(res.body.data.biweeklyStartDay2).toBe(15);
    });

    it('should return 422 when enabling custom without days', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ biweeklyCustomEnabled: true });

      expect(res.status).toBe(422);
    });

    it('should return 422 when day1 equals day2 with custom enabled', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          biweeklyCustomEnabled: true,
          biweeklyStartDay1: 15,
          biweeklyStartDay2: 15,
        });

      expect(res.status).toBe(422);
    });

    it('should return 422 when day is out of range', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          biweeklyCustomEnabled: true,
          biweeklyStartDay1: 32,
          biweeklyStartDay2: 15,
        });

      expect(res.status).toBe(422);
    });

    it('should accept disabling custom', async () => {
      const updated = {
        ...TEST_USER_PROFILE,
        biweeklyCustomEnabled: false,
        biweeklyStartDay1: 30,
        biweeklyStartDay2: 15,
      };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ biweeklyCustomEnabled: false });

      expect(res.status).toBe(200);
      expect(res.body.data.biweeklyCustomEnabled).toBe(false);
    });

    it('should not touch biweekly fields when only name changes', async () => {
      const updated = { ...TEST_USER_PROFILE, name: 'New Name' };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ biweeklyCustomEnabled: expect.anything() }),
        }),
      );
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete the user account', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockPrisma.user.delete as jest.Mock).mockResolvedValue(TEST_USER);

      const res = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
