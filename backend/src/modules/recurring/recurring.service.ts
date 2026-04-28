import { Prisma, Frequency } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta, getBalanceDelta, toNumber } from '../../utils/helpers';
import { validateCategory, validateAccount } from '../../utils/validators';
import {
  CreateRecurringInput,
  UpdateRecurringInput,
  GetRecurringQuery,
} from './recurring.schema';
import { checkAutoComplete } from '../goals/goals.service';

const INCLUDE = { category: true, account: true } as const;

async function findOwned(id: string, userId: string) {
  const recurring = await prisma.recurringTransaction.findUnique({ where: { id }, include: INCLUDE });
  if (!recurring || recurring.userId !== userId) throw new NotFoundError('Recurring transaction');
  return recurring;
}

function calculateNextExecutionDate(currentDate: Date, frequency: Frequency): Date {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'DAILY': next.setDate(next.getDate() + 1); break;
    case 'WEEKLY': next.setDate(next.getDate() + 7); break;
    case 'BIWEEKLY': next.setDate(next.getDate() + 14); break;
    case 'MONTHLY': next.setMonth(next.getMonth() + 1); break;
    case 'YEARLY': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}

export async function getAll(userId: string, filters: GetRecurringQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.RecurringTransactionWhereInput = { userId };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.type) where.type = filters.type;

  const [recurringTransactions, total] = await Promise.all([
    prisma.recurringTransaction.findMany({ where, include: INCLUDE, orderBy: { nextExecutionDate: 'asc' }, skip, take }),
    prisma.recurringTransaction.count({ where }),
  ]);

  return { recurringTransactions, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string, userId: string) {
  return findOwned(id, userId);
}

export async function create(userId: string, data: CreateRecurringInput) {
  await validateCategory(data.categoryId, userId);
  if (data.accountId) await validateAccount(data.accountId, userId);

  return prisma.recurringTransaction.create({
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
      accountId: data.accountId ?? null,
      goalId: data.goalId ?? null,
    },
    include: INCLUDE,
  });
}

export async function update(id: string, userId: string, data: UpdateRecurringInput) {
  await findOwned(id, userId);

  if (data.categoryId) await validateCategory(data.categoryId, userId);
  if (data.accountId) await validateAccount(data.accountId, userId);

  const updateData: Prisma.RecurringTransactionUpdateInput = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.nextExecutionDate !== undefined) updateData.nextExecutionDate = new Date(data.nextExecutionDate);
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };

  if (data.accountId !== undefined) {
    updateData.account = data.accountId === null ? { disconnect: true } : { connect: { id: data.accountId } };
  }
  if (data.goalId !== undefined) {
    updateData.goal = data.goalId === null ? { disconnect: true } : { connect: { id: data.goalId } };
  }

  return prisma.recurringTransaction.update({ where: { id }, data: updateData, include: INCLUDE });
}

export async function toggleActive(id: string, userId: string, isActive: boolean) {
  await findOwned(id, userId);
  return prisma.recurringTransaction.update({ where: { id }, data: { isActive }, include: INCLUDE });
}

export async function remove(id: string, userId: string) {
  await findOwned(id, userId);
  await prisma.recurringTransaction.delete({ where: { id } });
}

export async function processRecurring() {
  const dueRecurring = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextExecutionDate: { lte: new Date() } },
    include: { category: true },
  });

  const results = { processed: 0, errors: 0 };

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
            accountId: recurring.accountId,
            goalId: recurring.goalId,
          },
        });

        if (recurring.accountId) {
          const delta = getBalanceDelta(recurring.type, toNumber(recurring.amount));
          await tx.account.update({
            where: { id: recurring.accountId },
            data: { currentBalance: { increment: delta } },
          });
        }

        await tx.recurringTransaction.update({
          where: { id: recurring.id },
          data: { nextExecutionDate: calculateNextExecutionDate(recurring.nextExecutionDate, recurring.frequency) },
        });
      });

      if (recurring.goalId) await checkAutoComplete(recurring.goalId);
      results.processed++;
    } catch {
      results.errors++;
    }
  }

  return { ...results, total: dueRecurring.length };
}
