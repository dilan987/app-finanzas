import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsQuery,
} from './transactions.schema';

export async function getAll(userId: string, filters: GetTransactionsQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.TransactionWhereInput = {
    userId,
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate);
    }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) {
      where.amount.gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      where.amount.lte = filters.maxAmount;
    }
  }

  if (filters.search) {
    where.description = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortOrder,
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy,
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);

  const pagination = getPaginationMeta(total, page, limit);

  return { transactions, pagination };
}

export async function getById(id: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  if (transaction.userId !== userId) {
    throw new NotFoundError('Transaction');
  }

  return transaction;
}

export async function create(userId: string, data: CreateTransactionInput) {
  // Verify category exists and is accessible to the user
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (!category.isDefault && category.userId !== userId) {
    throw new ForbiddenError('You do not have access to this category');
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
      paymentMethod: data.paymentMethod,
      currency: data.currency,
      categoryId: data.categoryId,
      userId,
    },
    include: { category: true },
  });

  return transaction;
}

export async function update(id: string, userId: string, data: UpdateTransactionInput) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  if (transaction.userId !== userId) {
    throw new NotFoundError('Transaction');
  }

  // If categoryId is being updated, verify the new category
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    if (!category.isDefault && category.userId !== userId) {
      throw new ForbiddenError('You do not have access to this category');
    }
  }

  const updateData: Prisma.TransactionUpdateInput = {};

  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.categoryId !== undefined) {
    updateData.category = { connect: { id: data.categoryId } };
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return updated;
}

export async function remove(id: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  if (transaction.userId !== userId) {
    throw new NotFoundError('Transaction');
  }

  await prisma.transaction.delete({
    where: { id },
  });
}

export async function getMonthlyStats(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIncome = incomeResult._sum.amount?.toNumber() ?? 0;
  const totalExpense = expenseResult._sum.amount?.toNumber() ?? 0;

  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: incomeResult._count + expenseResult._count,
  };
}
