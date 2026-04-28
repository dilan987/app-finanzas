import { TourStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

export interface TourState {
  status: TourStatus;
  version: string | null;
  updatedAt: Date | null;
}

export interface UpdateTourInput {
  status: TourStatus;
  version?: string | null;
}

export async function getTourState(userId: string): Promise<TourState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tourStatus: true, tourVersion: true, tourUpdatedAt: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    status: user.tourStatus,
    version: user.tourVersion,
    updatedAt: user.tourUpdatedAt,
  };
}

export async function updateTourState(
  userId: string,
  input: UpdateTourInput,
): Promise<TourState> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User');
  }

  const isFinalState = input.status === 'COMPLETED' || input.status === 'SKIPPED';

  if (isFinalState && (!input.version || input.version.length === 0)) {
    throw new ValidationError({ version: ['version is required for COMPLETED or SKIPPED'] });
  }

  const nextVersion = input.status === 'NOT_STARTED' ? null : (input.version ?? null);
  const now = new Date();

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      tourStatus: input.status,
      tourVersion: nextVersion,
      tourUpdatedAt: now,
    },
    select: { tourStatus: true, tourVersion: true, tourUpdatedAt: true },
  });

  return {
    status: updated.tourStatus,
    version: updated.tourVersion,
    updatedAt: updated.tourUpdatedAt,
  };
}
