import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';
import {
  CreateBudgetInput,
  UpdateBudgetInput,
  GetBudgetsQuery,
} from './budgets.schema';

export async function getAll(userId: string, filters: GetBudgetsQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.BudgetWhereInput = {
    userId,
  };

  if (filters.month !== undefined) {
    where.month = filters.month;
  }

  if (filters.year !== undefined) {
    where.year = filters.year;
  }

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take,
    }),
    prisma.budget.count({ where }),
  ]);

  const pagination = getPaginationMeta(total, page, limit);

  return { budgets, pagination };
}

export async function getById(id: string, userId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!budget) {
    throw new NotFoundError('Budget');
  }

  if (budget.userId !== userId) {
    throw new NotFoundError('Budget');
  }

  return budget;
}

export async function create(userId: string, data: CreateBudgetInput) {
  // Validate category if provided
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

  const budget = await prisma.budget.create({
    data: {
      name: data.name ?? 'Presupuesto mensual',
      type: data.type ?? 'EXPENSE',
      categoryId: data.categoryId ?? null,
      userId,
      amount: data.amount,
      month: data.month,
      year: data.year,
    },
    include: { category: true },
  });

  return budget;
}

export async function update(id: string, userId: string, data: UpdateBudgetInput) {
  const budget = await prisma.budget.findUnique({
    where: { id },
  });

  if (!budget) {
    throw new NotFoundError('Budget');
  }

  if (budget.userId !== userId) {
    throw new NotFoundError('Budget');
  }

  const updateData: Prisma.BudgetUpdateInput = {};
  if (data.amount !== undefined) {
    updateData.amount = data.amount;
  }
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.categoryId !== undefined) {
    updateData.category = data.categoryId
      ? { connect: { id: data.categoryId } }
      : { disconnect: true };
  }

  const updated = await prisma.budget.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return updated;
}

export async function remove(id: string, userId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
  });

  if (!budget) {
    throw new NotFoundError('Budget');
  }

  if (budget.userId !== userId) {
    throw new NotFoundError('Budget');
  }

  await prisma.budget.delete({
    where: { id },
  });
}

/**
 * Build a WHERE clause that only includes transactions from on-budget accounts.
 * Transactions with null accountId are treated as on-budget (backward compatible).
 */
async function buildOnBudgetFilter(userId: string): Promise<Prisma.TransactionWhereInput> {
  const offBudgetAccountIds = await prisma.account.findMany({
    where: { userId, includeInBudget: false },
    select: { id: true },
  });

  if (offBudgetAccountIds.length === 0) {
    return {};
  }

  // Exclude transactions that belong to off-budget accounts.
  // Transactions with null accountId pass through (backward compatible).
  return {
    OR: [
      { accountId: null },
      { account: { includeInBudget: true } },
    ],
  };
}

export async function getMonthSummary(userId: string, month: number, year: number) {
  let budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  // Auto-copy from previous month if this month is empty and is current or future
  let copiedFromPrevious = false;
  if (budgets.length === 0) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isFutureOrCurrent = year > currentYear || (year === currentYear && month >= currentMonth);

    if (isFutureOrCurrent) {
      // Find the most recent month with budget items
      const latestBudget = await prisma.budget.findFirst({
        where: { userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: { month: true, year: true },
      });

      if (latestBudget) {
        // Don't copy from a future month into an earlier one
        const sourceDate = latestBudget.year * 12 + latestBudget.month;
        const targetDate = year * 12 + month;
        if (sourceDate < targetDate) {
          const sourceItems = await prisma.budget.findMany({
            where: { userId, month: latestBudget.month, year: latestBudget.year },
          });

          if (sourceItems.length > 0) {
            await prisma.budget.createMany({
              data: sourceItems.map((item) => ({
                name: item.name,
                type: item.type,
                categoryId: item.categoryId,
                userId,
                amount: item.amount,
                month,
                year,
              })),
            });

            budgets = await prisma.budget.findMany({
              where: { userId, month, year },
              include: { category: true },
            });
            copiedFromPrevious = true;
          }
        }
      }
    }
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Get on-budget filter for this user
  const onBudgetFilter = await buildOnBudgetFilter(userId);

  const summary = await Promise.all(
    budgets.map(async (budget) => {
      const budgetAmount = budget.amount.toNumber();
      let actualAmount = 0;

      if (budget.categoryId) {
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            type: budget.type as TransactionType,
            categoryId: budget.categoryId,
            date: { gte: startDate, lte: endDate },
            ...onBudgetFilter,
          },
          _sum: { amount: true },
        });
        actualAmount = result._sum.amount?.toNumber() ?? 0;
      }

      const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

      return {
        id: budget.id,
        name: budget.name,
        type: budget.type,
        categoryId: budget.categoryId,
        category: budget.category,
        budgetAmount,
        actualAmount,
        remainingAmount: budgetAmount - actualAmount,
        percentage: Math.round(percentage * 100) / 100,
        month: budget.month,
        year: budget.year,
      };
    }),
  );

  const incomeItems = summary.filter(i => i.type === 'INCOME');
  const expenseItems = summary.filter(i => i.type === 'EXPENSE');

  const totalProjectedIncome = incomeItems.reduce((acc, i) => acc + i.budgetAmount, 0);
  const totalProjectedExpenses = expenseItems.reduce((acc, i) => acc + i.budgetAmount, 0);

  // Get total actual transactions for the month (on-budget only)
  const [totalIncomeResult, totalExpensesResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
        date: { gte: startDate, lte: endDate },
        ...onBudgetFilter,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: startDate, lte: endDate },
        ...onBudgetFilter,
      },
      _sum: { amount: true },
    }),
  ]);
  const totalActualIncome = totalIncomeResult._sum?.amount?.toNumber() ?? 0;
  const totalActualExpenses = totalExpensesResult._sum?.amount?.toNumber() ?? 0;

  // Unplanned expenses = excess over budget + expenses in unbudgeted categories
  const plannedExpenseCategoryIds = budgets
    .filter(b => b.type === 'EXPENSE' && b.categoryId)
    .map(b => b.categoryId!);

  let unplannedExpenses = 0;
  if (expenseItems.length > 0 || plannedExpenseCategoryIds.length > 0) {
    const excessOverBudget = expenseItems.reduce(
      (sum, item) => sum + Math.max(0, item.actualAmount - item.budgetAmount), 0,
    );

    const unbudgetedWhere: Prisma.TransactionWhereInput = {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: startDate, lte: endDate },
      ...onBudgetFilter,
      OR: [
        ...(plannedExpenseCategoryIds.length > 0
          ? [{ categoryId: { notIn: plannedExpenseCategoryIds } }]
          : []),
        { categoryId: null },
      ],
    };

    const unbudgetedResult = await prisma.transaction.aggregate({
      where: unbudgetedWhere,
      _sum: { amount: true },
    });
    const unbudgetedExpenses = unbudgetedResult._sum?.amount?.toNumber() ?? 0;

    unplannedExpenses = excessOverBudget + unbudgetedExpenses;
  } else {
    unplannedExpenses = totalActualExpenses;
  }

  // ── Active goals for the month ──────────────────────────────────
  const targetDate = year * 12 + month;
  const allActiveGoals = await prisma.goal.findMany({
    where: { userId, status: 'ACTIVE' },
  });

  const activeGoals = allActiveGoals.filter((g) => {
    // SAVINGS goals are always active (no date range)
    if (g.type === 'SAVINGS') return true;
    // DEBT goals: check date range
    if (g.startYear == null || g.startMonth == null || g.projectedEndYear == null || g.projectedEndMonth == null) return true;
    const startDate2 = g.startYear * 12 + g.startMonth;
    const endDate2 = g.projectedEndYear * 12 + g.projectedEndMonth;
    return targetDate >= startDate2 && targetDate <= endDate2;
  });

  const goalsData = await Promise.all(
    activeGoals.map(async (goal) => {
      const [totalResult, monthResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: { goalId: goal.id },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            goalId: goal.id,
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
      ]);

      const totalPaid = totalResult._sum.amount?.toNumber() ?? 0;
      const paidThisMonth = monthResult._sum.amount?.toNumber() ?? 0;
      const target = goal.targetAmount.toNumber();

      return {
        id: goal.id,
        name: goal.name,
        type: goal.type,
        targetAmount: target,
        suggestedInstallment: goal.suggestedInstallment?.toNumber() ?? 0,
        totalPaid,
        paidThisMonth,
        progress: target > 0 ? Math.round((totalPaid / target) * 10000) / 100 : 0,
      };
    }),
  );

  const goalsTotalCommitment = goalsData.reduce((sum, g) => sum + g.suggestedInstallment, 0);
  const goalsTotalPaidThisMonth = goalsData.reduce((sum, g) => sum + g.paidThisMonth, 0);

  const projectedBalance = totalProjectedIncome - totalProjectedExpenses;
  const actualBalance = totalActualIncome - totalActualExpenses;

  return {
    month,
    year,
    totalProjectedIncome,
    totalProjectedExpenses,
    totalActualIncome,
    totalActualExpenses,
    projectedBalance,
    actualBalance,
    // Keep legacy fields for dashboard compatibility
    totalBudget: totalProjectedExpenses,
    totalRemaining: totalProjectedExpenses - totalActualExpenses,
    overallPercentage:
      totalProjectedExpenses > 0
        ? Math.round((totalActualExpenses / totalProjectedExpenses) * 10000) / 100
        : 0,
    unplannedExpenses,
    copiedFromPrevious,
    budgets: summary,
    goals: goalsData,
    goalsTotalCommitment,
    goalsTotalPaidThisMonth,
  };
}
