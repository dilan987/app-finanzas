import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta, getMonthRange, toNumber, roundPercent } from '../../utils/helpers';
import { validateCategory } from '../../utils/validators';
import {
  CreateBudgetInput,
  UpdateBudgetInput,
  GetBudgetsQuery,
} from './budgets.schema';

// ── Helpers ────────────────────────────────────────────────────────

async function findOwned(id: string, userId: string) {
  const budget = await prisma.budget.findUnique({ where: { id }, include: { category: true } });
  if (!budget || budget.userId !== userId) throw new NotFoundError('Budget');
  return budget;
}

async function buildOnBudgetFilter(userId: string): Promise<Prisma.TransactionWhereInput> {
  const offBudgetIds = await prisma.account.findMany({
    where: { userId, includeInBudget: false },
    select: { id: true },
  });

  if (offBudgetIds.length === 0) return {};

  return {
    OR: [{ accountId: null }, { account: { includeInBudget: true } }],
  };
}

async function autoCopyFromPreviousMonth(userId: string, month: number, year: number) {
  const latestBudget = await prisma.budget.findFirst({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    select: { month: true, year: true },
  });

  if (!latestBudget) return false;

  const sourceDate = latestBudget.year * 12 + latestBudget.month;
  const targetDate = year * 12 + month;
  if (sourceDate >= targetDate) return false;

  const sourceItems = await prisma.budget.findMany({
    where: { userId, month: latestBudget.month, year: latestBudget.year },
  });

  if (sourceItems.length === 0) return false;

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

  return true;
}

async function calculateBudgetSummary(
  budgets: Awaited<ReturnType<typeof prisma.budget.findMany>>,
  userId: string,
  start: Date,
  end: Date,
  onBudgetFilter: Prisma.TransactionWhereInput,
) {
  return Promise.all(
    budgets.map(async (budget) => {
      const budgetAmount = toNumber(budget.amount);
      let actualAmount = 0;

      if (budget.categoryId) {
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            type: budget.type as TransactionType,
            categoryId: budget.categoryId,
            date: { gte: start, lte: end },
            ...onBudgetFilter,
          },
          _sum: { amount: true },
        });
        actualAmount = toNumber(result._sum.amount);
      }

      return {
        id: budget.id,
        name: budget.name,
        type: budget.type,
        categoryId: budget.categoryId,
        category: (budget as Record<string, unknown>).category ?? null,
        budgetAmount,
        actualAmount,
        remainingAmount: budgetAmount - actualAmount,
        percentage: roundPercent(actualAmount, budgetAmount),
        month: budget.month,
        year: budget.year,
      };
    }),
  );
}

async function calculateUnplannedExpenses(
  budgets: { type: string; categoryId: string | null }[],
  expenseItems: { actualAmount: number; budgetAmount: number }[],
  userId: string,
  start: Date,
  end: Date,
  onBudgetFilter: Prisma.TransactionWhereInput,
  totalActualExpenses: number,
): Promise<number> {
  const plannedIds = budgets
    .filter((b) => b.type === 'EXPENSE' && b.categoryId)
    .map((b) => b.categoryId!);

  if (expenseItems.length === 0 && plannedIds.length === 0) return totalActualExpenses;

  const excessOverBudget = expenseItems.reduce(
    (sum, item) => sum + Math.max(0, item.actualAmount - item.budgetAmount),
    0,
  );

  const unbudgetedResult = await prisma.transaction.aggregate({
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: start, lte: end },
      ...onBudgetFilter,
      OR: [
        ...(plannedIds.length > 0 ? [{ categoryId: { notIn: plannedIds } }] : []),
        { categoryId: null },
      ],
    },
    _sum: { amount: true },
  });

  return excessOverBudget + toNumber(unbudgetedResult._sum.amount);
}

async function getActiveGoalsData(userId: string, month: number, year: number, start: Date, end: Date) {
  const targetDate = year * 12 + month;
  const allActiveGoals = await prisma.goal.findMany({
    where: { userId, status: 'ACTIVE' },
  });

  const activeGoals = allActiveGoals.filter((g) => {
    if (g.type === 'SAVINGS') return true;
    if (g.startYear == null || g.startMonth == null || g.projectedEndYear == null || g.projectedEndMonth == null) return true;
    const gStart = g.startYear * 12 + g.startMonth;
    const gEnd = g.projectedEndYear * 12 + g.projectedEndMonth;
    return targetDate >= gStart && targetDate <= gEnd;
  });

  const goalsData = await Promise.all(
    activeGoals.map(async (goal) => {
      const [totalResult, monthResult] = await Promise.all([
        prisma.transaction.aggregate({ where: { goalId: goal.id }, _sum: { amount: true } }),
        prisma.transaction.aggregate({
          where: { goalId: goal.id, date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      const target = toNumber(goal.targetAmount);
      const totalPaid = toNumber(totalResult._sum.amount);
      const paidThisMonth = toNumber(monthResult._sum.amount);

      return {
        id: goal.id,
        name: goal.name,
        type: goal.type,
        targetAmount: target,
        suggestedInstallment: toNumber(goal.suggestedInstallment),
        totalPaid,
        paidThisMonth,
        progress: roundPercent(totalPaid, target),
      };
    }),
  );

  return {
    goalsData,
    goalsTotalCommitment: goalsData.reduce((sum, g) => sum + g.suggestedInstallment, 0),
    goalsTotalPaidThisMonth: goalsData.reduce((sum, g) => sum + g.paidThisMonth, 0),
  };
}

// ── CRUD ───────────────────────────────────────────────────────────

export async function getAll(userId: string, filters: GetBudgetsQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.BudgetWhereInput = { userId };
  if (filters.month !== undefined) where.month = filters.month;
  if (filters.year !== undefined) where.year = filters.year;

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where, include: { category: true }, orderBy: [{ year: 'desc' }, { month: 'desc' }], skip, take,
    }),
    prisma.budget.count({ where }),
  ]);

  return { budgets, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string, userId: string) {
  return findOwned(id, userId);
}

export async function create(userId: string, data: CreateBudgetInput) {
  if (data.categoryId) await validateCategory(data.categoryId, userId);

  return prisma.budget.create({
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
}

export async function update(id: string, userId: string, data: UpdateBudgetInput) {
  await findOwned(id, userId);

  const updateData: Prisma.BudgetUpdateInput = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.categoryId !== undefined) {
    updateData.category = data.categoryId ? { connect: { id: data.categoryId } } : { disconnect: true };
  }

  return prisma.budget.update({ where: { id }, data: updateData, include: { category: true } });
}

export async function remove(id: string, userId: string) {
  await findOwned(id, userId);
  await prisma.budget.delete({ where: { id } });
}

// ── Month Summary ──────────────────────────────────────────────────

export async function getMonthSummary(userId: string, month: number, year: number) {
  let budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  let copiedFromPrevious = false;
  if (budgets.length === 0) {
    const now = new Date();
    const isFutureOrCurrent = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isFutureOrCurrent) {
      copiedFromPrevious = await autoCopyFromPreviousMonth(userId, month, year);
      if (copiedFromPrevious) {
        budgets = await prisma.budget.findMany({
          where: { userId, month, year },
          include: { category: true },
        });
      }
    }
  }

  const { start, end } = getMonthRange(month, year);
  const onBudgetFilter = await buildOnBudgetFilter(userId);
  const summary = await calculateBudgetSummary(budgets, userId, start, end, onBudgetFilter);

  const incomeItems = summary.filter((i) => i.type === 'INCOME');
  const expenseItems = summary.filter((i) => i.type === 'EXPENSE');

  const totalProjectedIncome = incomeItems.reduce((acc, i) => acc + i.budgetAmount, 0);
  const totalProjectedExpenses = expenseItems.reduce((acc, i) => acc + i.budgetAmount, 0);

  const [totalIncomeResult, totalExpensesResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.INCOME, date: { gte: start, lte: end }, ...onBudgetFilter },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE, date: { gte: start, lte: end }, ...onBudgetFilter },
      _sum: { amount: true },
    }),
  ]);

  const totalActualIncome = toNumber(totalIncomeResult._sum?.amount);
  const totalActualExpenses = toNumber(totalExpensesResult._sum?.amount);

  const unplannedExpenses = await calculateUnplannedExpenses(
    budgets, expenseItems, userId, start, end, onBudgetFilter, totalActualExpenses,
  );

  const { goalsData, goalsTotalCommitment, goalsTotalPaidThisMonth } =
    await getActiveGoalsData(userId, month, year, start, end);

  return {
    month,
    year,
    totalProjectedIncome,
    totalProjectedExpenses,
    totalActualIncome,
    totalActualExpenses,
    projectedBalance: totalProjectedIncome - totalProjectedExpenses,
    actualBalance: totalActualIncome - totalActualExpenses,
    totalBudget: totalProjectedExpenses,
    totalRemaining: totalProjectedExpenses - totalActualExpenses,
    overallPercentage: roundPercent(totalActualExpenses, totalProjectedExpenses),
    unplannedExpenses,
    copiedFromPrevious,
    budgets: summary,
    goals: goalsData,
    goalsTotalCommitment,
    goalsTotalPaidThisMonth,
  };
}
