import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { toNumber } from '../../utils/helpers';
import {
  CreateAccountInput,
  UpdateAccountInput,
  GetAccountsQuery,
  ReorderAccountsInput,
} from './accounts.schema';

function serializeAccount(a: { initialBalance: Prisma.Decimal; currentBalance: Prisma.Decimal } & Record<string, unknown>) {
  return { ...a, initialBalance: toNumber(a.initialBalance), currentBalance: toNumber(a.currentBalance) };
}

export async function getAll(userId: string, filters: GetAccountsQuery) {
  const where: Prisma.AccountWhereInput = { userId };

  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.type) where.type = filters.type;
  if (filters.includeInBudget !== undefined) where.includeInBudget = filters.includeInBudget;

  return prisma.account.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getById(id: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { id } });

  if (!account || account.userId !== userId) {
    throw new NotFoundError('Account');
  }

  return account;
}

export async function create(userId: string, data: CreateAccountInput) {
  const maxSort = await prisma.account.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });

  return prisma.account.create({
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
}

export async function update(id: string, userId: string, data: UpdateAccountInput) {
  await getById(id, userId);

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

  return prisma.account.update({ where: { id }, data: updateData });
}

export async function remove(id: string, userId: string) {
  await getById(id, userId);
  await prisma.account.update({ where: { id }, data: { isActive: false } });
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

  const sumBalance = (list: typeof accounts, filter?: (a: typeof accounts[0]) => boolean) =>
    (filter ? list.filter(filter) : list).reduce((sum, a) => sum + toNumber(a.currentBalance), 0);

  return {
    accounts: accounts.map(serializeAccount),
    onBudget: onBudget.map(serializeAccount),
    offBudget: offBudget.map(serializeAccount),
    netWorth: sumBalance(accounts, (a) => a.includeInTotal),
    onBudgetTotal: sumBalance(onBudget),
    offBudgetTotal: sumBalance(offBudget),
  };
}

export async function reconcileBalance(id: string, userId: string) {
  const account = await getById(id, userId);

  const [incomeResult, expenseResult, outgoingTransfers, incomingTransfers] = await Promise.all([
    prisma.transaction.aggregate({ where: { accountId: id, type: 'INCOME' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { accountId: id, type: 'EXPENSE' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { accountId: id, type: 'TRANSFER' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { transferAccountId: id, type: 'TRANSFER' }, _sum: { amount: true } }),
  ]);

  const computedBalance =
    toNumber(account.initialBalance) +
    toNumber(incomeResult._sum.amount) -
    toNumber(expenseResult._sum.amount) -
    toNumber(outgoingTransfers._sum.amount) +
    toNumber(incomingTransfers._sum.amount);

  const updated = await prisma.account.update({
    where: { id },
    data: { currentBalance: computedBalance },
  });

  return {
    previousBalance: toNumber(account.currentBalance),
    computedBalance,
    wasCorrect: toNumber(account.currentBalance) === computedBalance,
    account: serializeAccount(updated),
  };
}
