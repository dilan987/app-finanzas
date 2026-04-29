import bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  mainCurrency: string;
  timezone: string;
  biweeklyCustomEnabled: boolean;
  biweeklyStartDay1: number | null;
  biweeklyStartDay2: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateProfileData {
  name?: string;
  mainCurrency?: string;
  timezone?: string;
  biweeklyCustomEnabled?: boolean;
  biweeklyStartDay1?: number | null;
  biweeklyStartDay2?: number | null;
}

const BCRYPT_ROUNDS = 12;

export async function getProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      mainCurrency: true,
      timezone: true,
      biweeklyCustomEnabled: true,
      biweeklyStartDay1: true,
      biweeklyStartDay2: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileData,
): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      mainCurrency: true,
      timezone: true,
      biweeklyCustomEnabled: true,
      biweeklyStartDay1: true,
      biweeklyStartDay2: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User');
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isCurrentValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User');
  }

  await prisma.user.delete({ where: { id: userId } });
}
