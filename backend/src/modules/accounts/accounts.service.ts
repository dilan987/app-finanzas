import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import {
  CreateAccountInput,
  UpdateAccountInput,
  GetAccountsQuery,
  ReorderAccountsInput,
} from './accounts.schema';

export async function getAll(userId: string, filters: GetAccountsQuery) {
  const where: Prisma.AccountWhereInput = { userId };

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.includeInBudget !== undefined) {
    where.includeInBudget = filters.includeInBudget;
  }

  const accounts = await prisma.account.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return accounts;
}

export async function getById(id: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { id } });

  if (!account) {
    throw new NotFoundError('Account');
  }

  if (account.userId !== userId) {
    throw new NotFoundError('Account');
  }

  return account;
}

export async function create(userId: string, data: CreateAccountInput) {
  const maxSort = await prisma.account.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });

  const account = await prisma.account.create({
    data: {
      name: data.name,
      type: data.type,
      currency: data.currency ?? 'COP',
      initialBalance: data.initialBalance ?? 0,
      currentBalance: data.initialBalance ?? 0,
      institutionName: data.institutionName ?? null,
      color: data.color ?? '#3B82F6',
      icon: data.icon ?? 'wallet',
      includeInBudget: data.includeInBudget ?? true,
      includeInTotal: data.includeInTotal ?? true,
      notes: data.notes ?? null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      userId,
    },
  });

  return account;
}

export async function update(id: string, userId: string, data: UpdateAccountInput) {
  const account = await prisma.account.findUnique({ where: { id } });

  if (!account) {
    throw new NotFoundError('Account');
  }

  if (account.userId !== userId) {
    throw new NotFoundError('Account');
  }

  const updateData: Prisma.AccountUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.institutionName !== undefined) updateData.institutionName = data.institutionName;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.includeInBudget !== undefined) updateData.includeInBudget = data.includeInBudget;
  if (data.includeInTotal !== undefined) updateData.includeInTotal = data.includeInTotal;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const updated = await prisma.account.update({
    where: { id },
    data: updateData,
  });

  return updated;
}

export async function remove(id: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { id } });

  if (!account) {
    throw new NotFoundError('Account');
  }

  if (account.userId !== userId) {
    throw new NotFoundError('Account');
  }

  // Soft-delete: archive instead of hard delete
  await prisma.account.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function reorder(userId: string, data: ReorderAccountsInput) {
  await prisma.$transaction(
    data.accounts.map((item) =>
      prisma.account.updateMany({
        where: { id: item.id, userId },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  );
}

export async function getSummary(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const onBudget = accounts.filter((a) => a.includeInBudget);
  const offBudget = accounts.filter((a) => !a.includeInBudget);

  const netWorth = accounts
    .filter((a) => a.includeInTotal)
    .reduce((sum, a) => sum + a.currentBalance.toNumber(), 0);

  const onBudgetTotal = onBudget.reduce((sum, a) => sum + a.currentBalance.toNumber(), 0);
  const offBudgetTotal = offBudget.reduce((sum, a) => sum + a.currentBalance.toNumber(), 0);

  return {
    accounts: accounts.map((a) => ({
      ...a,
      initialBalance: a.initialBalance.toNumber(),
      currentBalance: a.currentBalance.toNumber(),
    })),
    onBudget: onBudget.map((a) => ({
      ...a,
      initialBalance: a.initialBalance.toNumber(),
      currentBalance: a.currentBalance.toNumber(),
    })),
    offBudget: offBudget.map((a) => ({
      ...a,
      initialBalance: a.initialBalance.toNumber(),
      currentBalance: a.currentBalance.toNumber(),
    })),
    netWorth,
    onBudgetTotal,
    offBudgetTotal,
  };
}

/**
 * Recalculates an account's balance from its initial balance + all transactions.
 * Use this for reconciliation or fixing drift.
 */
export async function reconcileBalance(id: string, userId: string) {
  const account = await getById(id, userId);

  // Sum all income/expense transactions on this account
  const [incomeResult, expenseResult, outgoingTransfers, incomingTransfers] = await Promise.all([
    prisma.transaction.aggregate({
      where: { accountId: id, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { accountId: id, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { accountId: id, type: 'TRANSFER' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { transferAccountId: id, type: 'TRANSFER' },
      _sum: { amount: true },
    }),
  ]);

  const income = incomeResult._sum.amount?.toNumber() ?? 0;
  const expense = expenseResult._sum.amount?.toNumber() ?? 0;
  const outgoing = outgoingTransfers._sum.amount?.toNumber() ?? 0;
  const incoming = incomingTransfers._sum.amount?.toNumber() ?? 0;

  const computedBalance = account.initialBalance.toNumber() + income - expense - outgoing + incoming;

  const updated = await prisma.account.update({
    where: { id },
    data: { currentBalance: computedBalance },
  });

  return {
    previousBalance: account.currentBalance.toNumber(),
    computedBalance,
    wasCorrect: account.currentBalance.toNumber() === computedBalance,
    account: { ...updated, currentBalance: updated.currentBalance.toNumber(), initialBalance: updated.initialBalance.toNumber() },
  };
}
