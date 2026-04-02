import request from 'supertest';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';

// Mock dependencies before importing modules
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    CORS_ORIGIN: 'http://localhost:5173',
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: 587,
    SMTP_USER: 'test@test.com',
    SMTP_PASS: 'password',
    SMTP_FROM: 'noreply@test.com',
    NODE_ENV: 'test',
  },
}));

jest.mock('bcrypt');
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

import { prisma } from '../../config/database';
import authRoutes from './auth.routes';
import { errorMiddleware } from '../../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
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

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(TEST_USER);
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: 'refresh-token',
        userId: TEST_USER.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'MyP@ssw0rd',
        name: 'Test User',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 409 if email already exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'MyP@ssw0rd',
        name: 'Test User',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'MyP@ssw0rd',
        name: 'Test User',
      });

      expect(res.status).toBe(422);
    });

    it('should return 422 for weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: 'refresh-token',
        userId: TEST_USER.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'MyP@ssw0rd',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 for non-existent user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'MyP@ssw0rd',
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 for wrong password', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'WrongP@ss1',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with a valid refresh token cookie', async () => {
      const storedToken = {
        id: 'rt-1',
        token: 'valid-refresh-token',
        userId: TEST_USER.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      (mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(storedToken);
      (mockPrisma.refreshToken.delete as jest.Mock).mockResolvedValue(storedToken);
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 'rt-2',
        token: 'new-refresh-token',
        userId: TEST_USER.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token']);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 when no refresh token cookie is present', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
    });

    it('should return 401 for expired refresh token', async () => {
      const expiredToken = {
        id: 'rt-1',
        token: 'expired-token',
        userId: TEST_USER.id,
        expiresAt: new Date(Date.now() - 86400000),
        createdAt: new Date(),
      };

      (mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(expiredToken);
      (mockPrisma.refreshToken.delete as jest.Mock).mockResolvedValue(expiredToken);

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=expired-token']);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear the refresh token cookie', async () => {
      (mockPrisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['refreshToken=some-token']);

      expect(res.status).toBe(204);
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-token' },
      });
    });

    it('should return 204 even without a refresh token', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(204);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success regardless of whether email exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'nonexistent@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 422 for invalid email format', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'not-valid',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const resetToken = {
        id: 'prt-1',
        token: crypto.randomBytes(64).toString('hex'),
        userId: TEST_USER.id,
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        createdAt: new Date(),
      };

      (mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(resetToken);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash');
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([]);

      const res = await request(app).post('/api/auth/reset-password').send({
        token: resetToken.token,
        newPassword: 'NewP@ssw0rd',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 422 for invalid token', async () => {
      (mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'invalid-token',
        newPassword: 'NewP@ssw0rd',
      });

      expect(res.status).toBe(422);
    });
  });
});
