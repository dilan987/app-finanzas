import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, AppError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsQuery,
} from './transactions.schema';
import { checkAutoComplete } from '../goals/goals.service';

// ── Helpers for account balance updates ─────────────────────────────

/**
 * Returns the balance delta to apply to an account for a given transaction.
 * Positive = account gains money, Negative = account loses money.
 */
function getBalanceDelta(type: TransactionType, amount: number): number {
  switch (type) {
    case 'INCOME':
      return amount;
    case 'EXPENSE':
      return -amount;
    case 'TRANSFER':
      return -amount; // Source account loses money
    default:
      return 0;
  }
}

// ── Queries ─────────────────────────────────────────────────────────

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

  if (filters.accountId) {
    // Show transactions where this account is source OR destination
    where.OR = [
      { accountId: filters.accountId },
      { transferAccountId: filters.accountId },
    ];
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
      include: {
        category: true,
        account: true,
        transferAccount: true,
      },
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
    include: {
      category: true,
      account: true,
      transferAccount: true,
    },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  if (transaction.userId !== userId) {
    throw new NotFoundError('Transaction');
  }

  return transaction;
}

// ── Create ──────────────────────────────────────────────────────────

export async function create(userId: string, data: CreateTransactionInput) {
  // Validate category if provided (required for INCOME/EXPENSE)
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

  // Validate accounts if provided
  if (data.accountId) {
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    if (!account || account.userId !== userId) {
      throw new NotFoundError('Account');
    }
  }

  if (data.transferAccountId) {
    const transferAccount = await prisma.account.findUnique({ where: { id: data.transferAccountId } });
    if (!transferAccount || transferAccount.userId !== userId) {
      throw new NotFoundError('Transfer account');
    }
  }

  // Validate goal if provided
  if (data.goalId) {
    const goal = await prisma.goal.findUnique({ where: { id: data.goalId } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundError('Goal');
    }
    if (goal.status !== 'ACTIVE') {
      throw new AppError('Cannot link transactions to a non-active goal', 400);
    }
    const validType = goal.type === 'DEBT' ? 'EXPENSE' : 'INCOME';
    if (data.type !== validType) {
      throw new AppError(`Only ${validType} transactions can be linked to ${goal.type} goals`, 400);
    }
  }

  const amount = data.amount;

  // Use a prisma transaction to atomically create + update balances
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
      include: {
        category: true,
        account: true,
        transferAccount: true,
      },
    });

    // Update source account balance
    if (data.accountId) {
      const delta = getBalanceDelta(data.type, amount);
      await tx.account.update({
        where: { id: data.accountId },
        data: { currentBalance: { increment: delta } },
      });
    }

    // Update destination account balance (transfers only)
    if (data.type === 'TRANSFER' && data.transferAccountId) {
      await tx.account.update({
        where: { id: data.transferAccountId },
        data: { currentBalance: { increment: amount } },
      });
    }

    return created;
  });

  // Check auto-complete after the DB transaction commits
  if (data.goalId) {
    await checkAutoComplete(data.goalId);
  }

  return transaction;
}

// ── Update ──────────────────────────────────────────────────────────

export async function update(id: string, userId: string, data: UpdateTransactionInput) {
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Transaction');
  }

  if (existing.userId !== userId) {
    throw new NotFoundError('Transaction');
  }

  // Validate new category if being changed
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

  // Validate new accounts if being changed
  if (data.accountId) {
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    if (!account || account.userId !== userId) {
      throw new NotFoundError('Account');
    }
  }

  if (data.transferAccountId) {
    const transferAccount = await prisma.account.findUnique({ where: { id: data.transferAccountId } });
    if (!transferAccount || transferAccount.userId !== userId) {
      throw new NotFoundError('Transfer account');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const oldAmount = existing.amount.toNumber();
    const oldType = existing.type;
    const oldAccountId = existing.accountId;
    const oldTransferAccountId = existing.transferAccountId;

    // Revert old balance impacts
    if (oldAccountId) {
      const oldDelta = getBalanceDelta(oldType, oldAmount);
      await tx.account.update({
        where: { id: oldAccountId },
        data: { currentBalance: { increment: -oldDelta } },
      });
    }

    if (oldType === 'TRANSFER' && oldTransferAccountId) {
      await tx.account.update({
        where: { id: oldTransferAccountId },
        data: { currentBalance: { increment: -oldAmount } },
      });
    }

    // Build update data
    const updateData: Prisma.TransactionUpdateInput = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.categoryId !== undefined) {
      if (data.categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: data.categoryId } };
      }
    }
    if (data.accountId !== undefined) {
      if (data.accountId === null) {
        updateData.account = { disconnect: true };
      } else {
        updateData.account = { connect: { id: data.accountId } };
      }
    }
    if (data.transferAccountId !== undefined) {
      if (data.transferAccountId === null) {
        updateData.transferAccount = { disconnect: true };
      } else {
        updateData.transferAccount = { connect: { id: data.transferAccountId } };
      }
    }
    if (data.goalId !== undefined) {
      if (data.goalId === null) {
        updateData.goal = { disconnect: true };
      } else {
        updateData.goal = { connect: { id: data.goalId } };
      }
    }

    const result = await tx.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        account: true,
        transferAccount: true,
      },
    });

    // Apply new balance impacts
    const newType = data.type ?? oldType;
    const newAmount = data.amount ?? oldAmount;
    const newAccountId = data.accountId !== undefined ? data.accountId : oldAccountId;
    const newTransferAccountId = data.transferAccountId !== undefined ? data.transferAccountId : oldTransferAccountId;

    if (newAccountId) {
      const newDelta = getBalanceDelta(newType, newAmount);
      await tx.account.update({
        where: { id: newAccountId },
        data: { currentBalance: { increment: newDelta } },
      });
    }

    if (newType === 'TRANSFER' && newTransferAccountId) {
      await tx.account.update({
        where: { id: newTransferAccountId },
        data: { currentBalance: { increment: newAmount } },
      });
    }

    return result;
  });

  // Check auto-complete for new and old goals
  const newGoalId = data.goalId !== undefined ? data.goalId : existing.goalId;
  if (newGoalId) {
    await checkAutoComplete(newGoalId);
  }
  if (existing.goalId && existing.goalId !== newGoalId) {
    // Old goal was unlinked — re-check (might revert from completed if sum dropped)
  }

  return updated;
}

// ── Delete ──────────────────────────────────────────────────────────

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

  await prisma.$transaction(async (tx) => {
    const amount = transaction.amount.toNumber();

    // Revert balance impact on source account
    if (transaction.accountId) {
      const delta = getBalanceDelta(transaction.type, amount);
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: { increment: -delta } },
      });
    }

    // Revert balance impact on destination account (transfers)
    if (transaction.type === 'TRANSFER' && transaction.transferAccountId) {
      await tx.account.update({
        where: { id: transaction.transferAccountId },
        data: { currentBalance: { increment: -amount } },
      });
    }

    await tx.transaction.delete({ where: { id } });
  });
}

// ── Stats ───────────────────────────────────────────────────────────

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
