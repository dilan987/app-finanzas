import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import {
  getPaginationParams,
  getPaginationMeta,
  getBalanceDelta,
  getMonthRange,
  toNumber,
} from '../../utils/helpers';
import { validateCategory, validateAccount, validateGoalForTransaction } from '../../utils/validators';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsQuery,
} from './transactions.schema';
import { checkAutoComplete } from '../goals/goals.service';

// ── Helpers ────────────────────────────────────────────────────────

async function findOwned(id: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== userId) throw new NotFoundError('Transaction');
  return transaction;
}

async function validateTransactionRefs(
  data: { categoryId?: string | null; accountId?: string | null; transferAccountId?: string | null; goalId?: string | null; type?: TransactionType },
  userId: string,
) {
  const tasks: Promise<void>[] = [];
  if (data.categoryId) tasks.push(validateCategory(data.categoryId, userId));
  if (data.accountId) tasks.push(validateAccount(data.accountId, userId));
  if (data.transferAccountId) tasks.push(validateAccount(data.transferAccountId, userId));
  if (data.goalId && data.type) tasks.push(validateGoalForTransaction(data.goalId, userId, data.type));
  await Promise.all(tasks);
}

function applyBalanceDelta(
  tx: Prisma.TransactionClient,
  accountId: string | null,
  transferAccountId: string | null,
  type: TransactionType,
  amount: number,
  sign: 1 | -1 = 1,
) {
  const ops: Promise<unknown>[] = [];
  if (accountId) {
    ops.push(tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: sign * getBalanceDelta(type, amount) } },
    }));
  }
  if (type === 'TRANSFER' && transferAccountId) {
    ops.push(tx.account.update({
      where: { id: transferAccountId },
      data: { currentBalance: { increment: sign * amount } },
    }));
  }
  return Promise.all(ops);
}

// ── Queries ────────────────────────────────────────────────────────

export async function getAll(userId: string, filters: GetTransactionsQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

  if (filters.accountId) {
    where.OR = [
      { accountId: filters.accountId },
      { transferAccountId: filters.accountId },
    ];
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
    if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
  }

  if (filters.search) {
    where.description = { contains: filters.search, mode: 'insensitive' };
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortOrder,
  };

  const include = { category: true, account: true, transferAccount: true };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, include, orderBy, skip, take }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { category: true, account: true, transferAccount: true },
  });

  if (!transaction || transaction.userId !== userId) {
    throw new NotFoundError('Transaction');
  }

  return transaction;
}

// ── Create ─────────────────────────────────────────────────────────

export async function create(userId: string, data: CreateTransactionInput) {
  await validateTransactionRefs(data, userId);

  const amount = data.amount;
  const include = { category: true, account: true, transferAccount: true };

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        type: data.type,
        amount,
        description: data.description,
        date: new Date(data.date),
        paymentMethod: data.paymentMethod,
        currency: data.currency,
        categoryId: data.categoryId ?? null,
        accountId: data.accountId ?? null,
        transferAccountId: data.transferAccountId ?? null,
        goalId: data.goalId ?? null,
        userId,
      },
      include,
    });

    await applyBalanceDelta(tx, data.accountId ?? null, data.transferAccountId ?? null, data.type, amount);

    return created;
  });

  if (data.goalId) await checkAutoComplete(data.goalId);

  return transaction;
}

// ── Update ─────────────────────────────────────────────────────────

export async function update(id: string, userId: string, data: UpdateTransactionInput) {
  const existing = await findOwned(id, userId);

  await validateTransactionRefs(data, userId);

  const include = { category: true, account: true, transferAccount: true };

  const updated = await prisma.$transaction(async (tx) => {
    const oldAmount = toNumber(existing.amount);
    const oldType = existing.type;
    const oldAccountId = existing.accountId;
    const oldTransferAccountId = existing.transferAccountId;

    // Revert old balance impacts
    await applyBalanceDelta(tx, oldAccountId, oldTransferAccountId, oldType, oldAmount, -1);

    // Build update data
    const updateData: Prisma.TransactionUpdateInput = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.currency !== undefined) updateData.currency = data.currency;

    const relMap: Array<[string, string | null | undefined]> = [
      ['category', data.categoryId],
      ['account', data.accountId],
      ['transferAccount', data.transferAccountId],
      ['goal', data.goalId],
    ];

    for (const [rel, val] of relMap) {
      if (val !== undefined) {
        (updateData as Record<string, unknown>)[rel] = val === null
          ? { disconnect: true }
          : { connect: { id: val } };
      }
    }

    const result = await tx.transaction.update({ where: { id }, data: updateData, include });

    // Apply new balance impacts
    const newType = data.type ?? oldType;
    const newAmount = data.amount ?? oldAmount;
    const newAccountId = data.accountId !== undefined ? data.accountId : oldAccountId;
    const newTransferAccountId = data.transferAccountId !== undefined ? data.transferAccountId : oldTransferAccountId;

    await applyBalanceDelta(tx, newAccountId, newTransferAccountId, newType, newAmount);

    return result;
  });

  const newGoalId = data.goalId !== undefined ? data.goalId : existing.goalId;
  if (newGoalId) await checkAutoComplete(newGoalId);

  return updated;
}

// ── Delete ─────────────────────────────────────────────────────────

export async function remove(id: string, userId: string) {
  const transaction = await findOwned(id, userId);

  await prisma.$transaction(async (tx) => {
    const amount = toNumber(transaction.amount);
    await applyBalanceDelta(tx, transaction.accountId, transaction.transferAccountId, transaction.type, amount, -1);
    await tx.transaction.delete({ where: { id } });
  });
}

// ── Stats ──────────────────────────────────────────────────────────

export async function getMonthlyStats(userId: string, month: number, year: number) {
  const { start, end } = getMonthRange(month, year);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.INCOME, date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIncome = toNumber(incomeResult._sum.amount);
  const totalExpense = toNumber(expenseResult._sum.amount);

  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: incomeResult._count + expenseResult._count,
  };
}
