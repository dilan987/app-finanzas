import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError, ValidationError } from '../../utils/errors';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  mainCurrency: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthResult {
  user: UserWithoutPassword;
  tokens: AuthTokens;
}

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function excludePassword(user: {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  mainCurrency: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}): UserWithoutPassword {
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function generateTokens(userId: string): Promise<AuthTokens> {
  const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = crypto.randomBytes(64).toString('hex');

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    },
  });

  return { accessToken, refreshToken };
}

function createMailTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ConflictError('A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  const tokens = await generateTokens(user.id);

  return { user: excludePassword(user), tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = await generateTokens(user.id);

  return { user: excludePassword(user), tokens };
}

export async function refreshToken(token: string): Promise<AuthTokens> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new UnauthorizedError('Refresh token has expired');
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  return generateTokens(storedToken.userId);
}

export async function logout(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return;
  }

  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const transporter = createMailTransporter();

  const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    throw new ValidationError({ token: ['Invalid or expired reset token'] });
  }

  if (resetToken.used) {
    throw new ValidationError({ token: ['This reset token has already been used'] });
  }

  if (resetToken.expiresAt < new Date()) {
    throw new ValidationError({ token: ['Reset token has expired'] });
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
    // Invalidate all refresh tokens for security
    prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);
}
