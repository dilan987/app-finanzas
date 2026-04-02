import { Prisma, Frequency } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';
import {
  CreateRecurringInput,
  UpdateRecurringInput,
  GetRecurringQuery,
} from './recurring.schema';

export async function getAll(userId: string, filters: GetRecurringQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.RecurringTransactionWhereInput = {
    userId,
  };

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const [recurringTransactions, total] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where,
      include: { category: true },
      orderBy: { nextExecutionDate: 'asc' },
      skip,
      take,
    }),
    prisma.recurringTransaction.count({ where }),
  ]);

  const pagination = getPaginationMeta(total, page, limit);

  return { recurringTransactions, pagination };
}

export async function getById(id: string, userId: string) {
  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!recurring) {
    throw new NotFoundError('Recurring transaction');
  }

  if (recurring.userId !== userId) {
    throw new NotFoundError('Recurring transaction');
  }

  return recurring;
}

export async function create(userId: string, data: CreateRecurringInput) {
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (!category.isDefault && category.userId !== userId) {
    throw new NotFoundError('Category');
  }

  const recurring = await prisma.recurringTransaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      categoryId: data.categoryId,
      userId,
      frequency: data.frequency,
      nextExecutionDate: new Date(data.nextExecutionDate),
      paymentMethod: data.paymentMethod,
      currency: data.currency,
    },
    include: { category: true },
  });

  return recurring;
}

export async function update(id: string, userId: string, data: UpdateRecurringInput) {
  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id },
  });

  if (!recurring) {
    throw new NotFoundError('Recurring transaction');
  }

  if (recurring.userId !== userId) {
    throw new NotFoundError('Recurring transaction');
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    if (!category.isDefault && category.userId !== userId) {
      throw new NotFoundError('Category');
    }
  }

  const updateData: Prisma.RecurringTransactionUpdateInput = {};

  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.nextExecutionDate !== undefined) {
    updateData.nextExecutionDate = new Date(data.nextExecutionDate);
  }
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.categoryId !== undefined) {
    updateData.category = { connect: { id: data.categoryId } };
  }

  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return updated;
}

export async function toggleActive(id: string, userId: string, isActive: boolean) {
  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id },
  });

  if (!recurring) {
    throw new NotFoundError('Recurring transaction');
  }

  if (recurring.userId !== userId) {
    throw new NotFoundError('Recurring transaction');
  }

  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: { isActive },
    include: { category: true },
  });

  return updated;
}

export async function remove(id: string, userId: string) {
  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id },
  });

  if (!recurring) {
    throw new NotFoundError('Recurring transaction');
  }

  if (recurring.userId !== userId) {
    throw new NotFoundError('Recurring transaction');
  }

  await prisma.recurringTransaction.delete({
    where: { id },
  });
}

function calculateNextExecutionDate(currentDate: Date, frequency: Frequency): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

export async function processRecurring() {
  const now = new Date();

  const dueRecurring = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextExecutionDate: { lte: now },
    },
    include: { category: true },
  });

  const results: { processed: number; errors: number } = {
    processed: 0,
    errors: 0,
  };

  for (const recurring of dueRecurring) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            type: recurring.type,
            amount: recurring.amount,
            description: recurring.description,
            date: recurring.nextExecutionDate,
            paymentMethod: recurring.paymentMethod,
            currency: recurring.currency,
            categoryId: recurring.categoryId,
            userId: recurring.userId,
            recurringId: recurring.id,
          },
        });

        const nextDate = calculateNextExecutionDate(
          recurring.nextExecutionDate,
          recurring.frequency,
        );

        await tx.recurringTransaction.update({
          where: { id: recurring.id },
          data: { nextExecutionDate: nextDate },
        });
      });

      results.processed++;
    } catch {
      results.errors++;
    }
  }

  return {
    ...results,
    total: dueRecurring.length,
  };
}
