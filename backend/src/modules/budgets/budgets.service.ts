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

  // Get total actual transactions for the month
  const [totalIncomeResult, totalExpensesResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.INCOME, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
  ]);
  const totalActualIncome = totalIncomeResult._sum?.amount?.toNumber() ?? 0;
  const totalActualExpenses = totalExpensesResult._sum?.amount?.toNumber() ?? 0;

  // Unplanned expenses (in categories not covered by any expense budget item)
  const plannedExpenseCategoryIds = budgets
    .filter(b => b.type === 'EXPENSE' && b.categoryId)
    .map(b => b.categoryId!);

  let unplannedExpenses = 0;
  if (plannedExpenseCategoryIds.length > 0) {
    const unplannedResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: startDate, lte: endDate },
        categoryId: { notIn: plannedExpenseCategoryIds },
      },
      _sum: { amount: true },
    });
    unplannedExpenses = unplannedResult._sum?.amount?.toNumber() ?? 0;
  } else {
    unplannedExpenses = totalActualExpenses;
  }

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
  };
}
