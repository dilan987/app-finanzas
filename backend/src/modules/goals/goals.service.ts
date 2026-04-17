import { Prisma, GoalStatus, ContributionFrequency } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, AppError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta, formatCurrency } from '../../utils/helpers';
import {
  CreateGoalInput,
  UpdateGoalInput,
  GetGoalsQuery,
} from './goals.schema';

// ── Helpers ─────────────────────────────────────────────────────────

function calculateProjectedEnd(startMonth: number, startYear: number, installments: number) {
  const totalMonths = startYear * 12 + startMonth - 1 + installments - 1;
  const endYear = Math.floor(totalMonths / 12);
  const endMonth = (totalMonths % 12) + 1;
  return { projectedEndMonth: endMonth, projectedEndYear: endYear };
}

function calculateSuggestedInstallment(targetAmount: number, installments: number): number {
  return Math.round((targetAmount / installments) * 100) / 100;
}

function frequencyToMonthlyMultiplier(freq: ContributionFrequency): number {
  switch (freq) {
    case 'WEEKLY': return 4;
    case 'BIWEEKLY': return 2;
    case 'MONTHLY': return 1;
  }
}

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function serializeGoal(goal: any) {
  return {
    ...goal,
    targetAmount: goal.targetAmount?.toNumber?.() ?? goal.targetAmount,
    suggestedInstallment: goal.suggestedInstallment?.toNumber?.() ?? goal.suggestedInstallment ?? null,
    plannedContribution: goal.plannedContribution?.toNumber?.() ?? goal.plannedContribution ?? null,
    contributionFrequency: goal.contributionFrequency ?? null,
    plannedInstallments: goal.plannedInstallments ?? null,
    startMonth: goal.startMonth ?? null,
    startYear: goal.startYear ?? null,
    projectedEndMonth: goal.projectedEndMonth ?? null,
    projectedEndYear: goal.projectedEndYear ?? null,
  };
}

async function checkAutoComplete(goalId: string): Promise<boolean> {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.status !== 'ACTIVE') return false;

  const result = await prisma.transaction.aggregate({
    where: { goalId },
    _sum: { amount: true },
  });

  const totalPaid = result._sum.amount?.toNumber() ?? 0;
  const target = goal.targetAmount.toNumber();

  if (totalPaid >= target) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { status: 'COMPLETED' },
    });
    return true;
  }
  return false;
}

// ── Queries ─────────────────────────────────────────────────────────

export async function getAll(userId: string, filters: GetGoalsQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.GoalWhereInput = { userId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const [goals, total] = await Promise.all([
    prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.goal.count({ where }),
  ]);

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const result = await prisma.transaction.aggregate({
        where: { goalId: goal.id },
        _sum: { amount: true },
      });
      const totalPaid = result._sum.amount?.toNumber() ?? 0;
      const target = goal.targetAmount.toNumber();
      return {
        ...serializeGoal(goal),
        totalPaid,
        progress: target > 0 ? Math.round((totalPaid / target) * 10000) / 100 : 0,
      };
    }),
  );

  const pagination = getPaginationMeta(total, page, limit);
  return { goals: goalsWithProgress, pagination };
}

export async function getById(id: string, userId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      transactions: {
        include: { category: true, account: true },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!goal) {
    throw new NotFoundError('Goal');
  }

  if (goal.userId !== userId) {
    throw new NotFoundError('Goal');
  }

  const totalPaid = goal.transactions.reduce(
    (sum, tx) => sum + tx.amount.toNumber(),
    0,
  );
  const target = goal.targetAmount.toNumber();

  return {
    ...serializeGoal(goal),
    totalPaid,
    progress: target > 0 ? Math.round((totalPaid / target) * 10000) / 100 : 0,
    transactions: goal.transactions.map((tx) => ({
      ...tx,
      amount: tx.amount.toNumber(),
    })),
  };
}

// ── Create ──────────────────────────────────────────────────────────

export async function create(userId: string, data: CreateGoalInput) {
  if (data.type === 'DEBT') {
    // DEBT path — existing logic
    const suggestedInstallment = calculateSuggestedInstallment(
      data.targetAmount,
      data.plannedInstallments,
    );
    const { projectedEndMonth, projectedEndYear } = calculateProjectedEnd(
      data.startMonth,
      data.startYear,
      data.plannedInstallments,
    );

    const goal = await prisma.goal.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        type: 'DEBT',
        targetAmount: data.targetAmount,
        plannedInstallments: data.plannedInstallments,
        suggestedInstallment,
        startMonth: data.startMonth,
        startYear: data.startYear,
        projectedEndMonth,
        projectedEndYear,
        userId,
      },
    });

    return {
      ...serializeGoal(goal),
      totalPaid: 0,
      progress: 0,
    };
  }

  // SAVINGS path — new logic
  // Validate contribution pair: if one is provided, both must be
  const hasFreq = 'contributionFrequency' in data && data.contributionFrequency !== undefined;
  const hasAmount = 'plannedContribution' in data && data.plannedContribution !== undefined;
  if (hasFreq !== hasAmount) {
    throw new AppError(
      'Both contributionFrequency and plannedContribution must be provided together',
      400,
    );
  }

  const goal = await prisma.goal.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      type: 'SAVINGS',
      targetAmount: data.targetAmount,
      contributionFrequency: hasFreq ? (data as any).contributionFrequency : null,
      plannedContribution: hasAmount ? (data as any).plannedContribution : null,
      // DEBT fields are null for SAVINGS
      plannedInstallments: null,
      suggestedInstallment: null,
      startMonth: null,
      startYear: null,
      projectedEndMonth: null,
      projectedEndYear: null,
      userId,
    },
  });

  return {
    ...serializeGoal(goal),
    totalPaid: 0,
    progress: 0,
  };
}

// ── Update ──────────────────────────────────────────────────────────

export async function update(id: string, userId: string, data: UpdateGoalInput) {
  const goal = await prisma.goal.findUnique({ where: { id } });

  if (!goal) {
    throw new NotFoundError('Goal');
  }

  if (goal.userId !== userId) {
    throw new NotFoundError('Goal');
  }

  const updateData: Prisma.GoalUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  if (goal.type === 'DEBT') {
    // DEBT update: recalculate installments
    if (data.plannedInstallments !== undefined) {
      const target = goal.targetAmount.toNumber();
      const newSuggested = calculateSuggestedInstallment(target, data.plannedInstallments);
      const { projectedEndMonth, projectedEndYear } = calculateProjectedEnd(
        goal.startMonth!,
        goal.startYear!,
        data.plannedInstallments,
      );
      updateData.plannedInstallments = data.plannedInstallments;
      updateData.suggestedInstallment = newSuggested;
      updateData.projectedEndMonth = projectedEndMonth;
      updateData.projectedEndYear = projectedEndYear;
    }
  } else {
    // SAVINGS update: update contribution fields
    if (data.contributionFrequency !== undefined) {
      updateData.contributionFrequency = data.contributionFrequency;
    }
    if (data.plannedContribution !== undefined) {
      updateData.plannedContribution = data.plannedContribution;
    }
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: updateData,
  });

  // Calculate current progress
  const result = await prisma.transaction.aggregate({
    where: { goalId: id },
    _sum: { amount: true },
  });
  const totalPaid = result._sum.amount?.toNumber() ?? 0;
  const target = updated.targetAmount.toNumber();

  return {
    ...serializeGoal(updated),
    totalPaid,
    progress: target > 0 ? Math.round((totalPaid / target) * 10000) / 100 : 0,
  };
}

// ── Cancel ──────────────────────────────────────────────────────────

export async function cancel(id: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });

  if (!goal) {
    throw new NotFoundError('Goal');
  }

  if (goal.userId !== userId) {
    throw new NotFoundError('Goal');
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: { status: GoalStatus.CANCELLED },
  });

  return serializeGoal(updated);
}

// ── Link/Unlink Transactions ────────────────────────────────────────

export async function linkTransaction(goalId: string, transactionId: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new NotFoundError('Goal');
  if (goal.userId !== userId) throw new NotFoundError('Goal');
  if (goal.status !== 'ACTIVE') {
    throw new AppError('Cannot link transactions to a non-active goal', 400);
  }

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction) throw new NotFoundError('Transaction');
  if (transaction.userId !== userId) throw new NotFoundError('Transaction');

  if (transaction.goalId) {
    throw new AppError('Transaction is already linked to a goal', 400);
  }

  const validType = goal.type === 'DEBT' ? 'EXPENSE' : 'INCOME';
  if (transaction.type !== validType) {
    throw new AppError(
      `Only ${validType} transactions can be linked to ${goal.type} goals`,
      400,
    );
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { goalId },
  });

  const completed = await checkAutoComplete(goalId);

  return { linked: true, goalCompleted: completed };
}

export async function unlinkTransaction(goalId: string, transactionId: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new NotFoundError('Goal');
  if (goal.userId !== userId) throw new NotFoundError('Goal');

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction) throw new NotFoundError('Transaction');
  if (transaction.goalId !== goalId) {
    throw new AppError('Transaction is not linked to this goal', 400);
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { goalId: null },
  });

  return { unlinked: true };
}

// ── Active for Month ────────────────────────────────────────────────

export async function getActiveForMonth(userId: string, month: number, year: number) {
  const targetDate = year * 12 + month;

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  // Filter goals: SAVINGS goals are always active, DEBT goals check date range
  const activeGoals = goals.filter((g) => {
    if (g.type === 'SAVINGS') return true;
    // DEBT: check if month is within start–end range
    if (g.startMonth == null || g.startYear == null || g.projectedEndMonth == null || g.projectedEndYear == null) {
      return true; // Safety fallback
    }
    const startDate = g.startYear * 12 + g.startMonth;
    const endDate = g.projectedEndYear * 12 + g.projectedEndMonth;
    return targetDate >= startDate && targetDate <= endDate;
  });

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const result = await Promise.all(
    activeGoals.map(async (goal) => {
      const [totalResult, monthResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: { goalId: goal.id },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            goalId: goal.id,
            date: { gte: startOfMonth, lte: endOfMonth },
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
        status: goal.status,
        targetAmount: target,
        suggestedInstallment: goal.suggestedInstallment?.toNumber() ?? null,
        totalPaid,
        paidThisMonth,
        progress: target > 0 ? Math.round((totalPaid / target) * 10000) / 100 : 0,
        startMonth: goal.startMonth ?? null,
        startYear: goal.startYear ?? null,
        projectedEndMonth: goal.projectedEndMonth ?? null,
        projectedEndYear: goal.projectedEndYear ?? null,
        plannedInstallments: goal.plannedInstallments ?? null,
        contributionFrequency: goal.contributionFrequency ?? null,
        plannedContribution: goal.plannedContribution?.toNumber() ?? null,
      };
    }),
  );

  // Commitment: DEBT uses suggestedInstallment, SAVINGS uses planned monthly rate
  const totalCommitment = result.reduce((sum, g) => {
    if (g.type === 'DEBT' && g.suggestedInstallment != null) {
      return sum + g.suggestedInstallment;
    }
    if (g.type === 'SAVINGS' && g.contributionFrequency && g.plannedContribution != null) {
      return sum + g.plannedContribution * frequencyToMonthlyMultiplier(g.contributionFrequency as ContributionFrequency);
    }
    return sum;
  }, 0);
  const totalPaidThisMonth = result.reduce((sum, g) => sum + g.paidThisMonth, 0);

  return {
    goals: result,
    totalCommitment,
    totalPaidThisMonth,
  };
}

// ── Projection Engine ───────────────────────────────────────────────

export interface GoalProjection {
  goalId: string;
  goalType: string;
  historicalMonthlyRate: number | null;
  historicalMonthsRemaining: number | null;
  historicalCompletionDate: string | null;
  plannedMonthlyRate: number | null;
  plannedMonthsRemaining: number | null;
  plannedCompletionDate: string | null;
  actualMonthlyRate: number | null;
  actualMonthsRemaining: number | null;
  actualCompletionDate: string | null;
  paceStatus: 'ahead' | 'behind' | 'on_track' | 'no_data';
  insightMessages: string[];
  // Smart projection fields
  netMonthlySavings: number | null;
  availableBalance: number;
  totalGoalCommitments: number;
  isOvercommitted: boolean;
  monthsOfData: number;
}

interface NetSavingsResult {
  netMonthlySavings: number;
  monthsOfData: number;
}

async function getNetMonthlySavings(userId: string): Promise<NetSavingsResult | null> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ['INCOME', 'EXPENSE'] },
      date: { gte: sixMonthsAgo },
    },
    select: { amount: true, date: true, type: true },
  });

  if (transactions.length === 0) return null;

  // Group by month: track income and expense separately
  const monthlyIncome = new Map<string, number>();
  const monthlyExpense = new Map<string, number>();

  for (const tx of transactions) {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (tx.type === 'INCOME') {
      monthlyIncome.set(key, (monthlyIncome.get(key) ?? 0) + tx.amount.toNumber());
    } else {
      monthlyExpense.set(key, (monthlyExpense.get(key) ?? 0) + tx.amount.toNumber());
    }
  }

  // Compute net savings per month (union of all months with data)
  const allMonthKeys = new Set([...monthlyIncome.keys(), ...monthlyExpense.keys()]);
  if (allMonthKeys.size === 0) return null;

  const monthlyNet = new Map<string, number>();
  for (const key of allMonthKeys) {
    const income = monthlyIncome.get(key) ?? 0;
    const expense = monthlyExpense.get(key) ?? 0;
    monthlyNet.set(key, income - expense);
  }

  // Sort months by date (most recent first)
  const sortedMonths = Array.from(monthlyNet.entries()).sort((a, b) => {
    const [aYear, aMonth] = a[0].split('-').map(Number);
    const [bYear, bMonth] = b[0].split('-').map(Number);
    return (bYear! * 12 + bMonth!) - (aYear! * 12 + aMonth!);
  });

  // Weighted average: recent half weighted 2×, older half weighted 1×
  const midpoint = Math.ceil(sortedMonths.length / 2);
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < sortedMonths.length; i++) {
    const weight = i < midpoint ? 2 : 1;
    weightedSum += sortedMonths[i]![1] * weight;
    totalWeight += weight;
  }

  return {
    netMonthlySavings: Math.round(weightedSum / totalWeight),
    monthsOfData: sortedMonths.length,
  };
}

async function getAvailableBalance(userId: string): Promise<number> {
  const result = await prisma.account.aggregate({
    where: {
      userId,
      isActive: true,
      includeInTotal: true,
    },
    _sum: { currentBalance: true },
  });

  return result._sum.currentBalance?.toNumber() ?? 0;
}

async function getTotalGoalCommitments(userId: string, excludeGoalId: string): Promise<number> {
  const otherGoals = await prisma.goal.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      id: { not: excludeGoalId },
    },
  });

  let total = 0;
  for (const g of otherGoals) {
    if (g.type === 'DEBT' && g.suggestedInstallment != null) {
      total += g.suggestedInstallment.toNumber();
    } else if (g.type === 'SAVINGS' && g.contributionFrequency && g.plannedContribution != null) {
      total += g.plannedContribution.toNumber() * frequencyToMonthlyMultiplier(g.contributionFrequency);
    }
  }

  return total;
}

function getPlannedMonthlyRate(
  frequency: ContributionFrequency | null,
  amount: number | null,
): number | null {
  if (!frequency || amount == null) return null;
  return amount * frequencyToMonthlyMultiplier(frequency);
}

async function getActualMonthlyRate(goalId: string, createdAt: Date): Promise<number | null> {
  const result = await prisma.transaction.aggregate({
    where: { goalId },
    _sum: { amount: true },
  });

  const totalPaid = result._sum.amount?.toNumber() ?? 0;
  if (totalPaid <= 0) return null;

  const now = new Date();
  const monthsElapsed = Math.max(
    1,
    (now.getFullYear() - createdAt.getFullYear()) * 12 +
      (now.getMonth() - createdAt.getMonth()) || 1,
  );

  return Math.round(totalPaid / monthsElapsed);
}

export async function getProjection(goalId: string, userId: string): Promise<GoalProjection> {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new NotFoundError('Goal');
  if (goal.userId !== userId) throw new NotFoundError('Goal');

  const target = goal.targetAmount.toNumber();

  // Get total paid
  const aggResult = await prisma.transaction.aggregate({
    where: { goalId },
    _sum: { amount: true },
  });
  const totalPaid = aggResult._sum.amount?.toNumber() ?? 0;
  const remaining = Math.max(0, target - totalPaid);

  const now = new Date();
  const insightMessages: string[] = [];

  // Near completion check
  if (remaining > 0 && remaining <= target * 0.1) {
    insightMessages.push(`Estas a solo ${formatCurrency(remaining)} de completar tu meta!`);
  }

  // ── Smart projection data (SAVINGS only) ──────────────────────
  let netMonthlySavings: number | null = null;
  let monthsOfData = 0;
  let availableBalance = 0;
  let totalGoalCommitments = 0;
  let isOvercommitted = false;

  if (goal.type === 'SAVINGS') {
    // Fetch all smart projection data in parallel
    const [savingsResult, balance, commitments] = await Promise.all([
      getNetMonthlySavings(userId),
      getAvailableBalance(userId),
      getTotalGoalCommitments(userId, goalId),
    ]);

    availableBalance = balance;
    totalGoalCommitments = commitments;

    if (savingsResult) {
      netMonthlySavings = savingsResult.netMonthlySavings;
      monthsOfData = savingsResult.monthsOfData;
      isOvercommitted = totalGoalCommitments > 0 && netMonthlySavings > 0 && totalGoalCommitments > netMonthlySavings;
    }
  }

  // ── Historical rate = net savings (SAVINGS only) ──────────────
  const historicalMonthlyRate = netMonthlySavings;

  let historicalMonthsRemaining: number | null = null;
  let historicalCompletionDate: string | null = null;

  if (goal.type === 'SAVINGS') {
    if (netMonthlySavings !== null && netMonthlySavings > 0 && remaining > 0) {
      historicalMonthsRemaining = Math.ceil(remaining / netMonthlySavings);
      historicalCompletionDate = addMonthsToDate(now, historicalMonthsRemaining).toISOString().split('T')[0]!;
      insightMessages.push(
        `Segun tu ahorro neto promedio de ${formatCurrency(netMonthlySavings)}/mes (ingresos - gastos), podrias alcanzar esta meta en aproximadamente ${historicalMonthsRemaining} meses.`,
      );

      // Limited data caveat
      if (monthsOfData <= 1) {
        insightMessages.push(`Basado en solo ${monthsOfData} mes de datos. La precision mejorara con mas historial.`);
      }
    } else if (netMonthlySavings !== null && netMonthlySavings === 0) {
      insightMessages.push('Tu ahorro neto es $0/mes. Reduce gastos o aumenta ingresos para avanzar en esta meta.');
    } else if (netMonthlySavings !== null && netMonthlySavings < 0) {
      insightMessages.push('Tu promedio de gastos supera tus ingresos. Revisa tu presupuesto para poder ahorrar hacia esta meta.');
    } else {
      insightMessages.push('Registra transacciones de ingreso y gasto para obtener proyecciones basadas en tu ahorro neto.');
    }

    // ── Balance-aware insight ─────────────────────────────────────
    if (availableBalance > 0 && remaining > 0) {
      if (availableBalance >= remaining) {
        insightMessages.push('Tu saldo actual ya cubre esta meta. Puedes completarla cuando quieras!');
      } else {
        const remainingAfterBalance = remaining - availableBalance;
        const monthsWithBalance = netMonthlySavings && netMonthlySavings > 0
          ? Math.ceil(remainingAfterBalance / netMonthlySavings)
          : null;
        const monthsSuffix = monthsWithBalance ? ` (~${monthsWithBalance} meses a tu ritmo actual)` : '';
        insightMessages.push(
          `Con tu saldo disponible de ${formatCurrency(availableBalance)}, necesitarias ahorrar ${formatCurrency(remainingAfterBalance)} adicionales${monthsSuffix}.`,
        );
      }
    }

    // ── Overcommitment warning ────────────────────────────────────
    if (isOvercommitted) {
      insightMessages.push(
        `Tus compromisos totales en metas (${formatCurrency(totalGoalCommitments)}/mes) superan tu ahorro neto (${formatCurrency(netMonthlySavings!)}/ mes). Considera priorizar tus metas.`,
      );
    }
  }

  // ── Planned rate (SAVINGS only, when contribution defined) ────
  const plannedMonthlyRate = getPlannedMonthlyRate(
    goal.contributionFrequency,
    goal.plannedContribution?.toNumber() ?? null,
  );

  let plannedMonthsRemaining: number | null = null;
  let plannedCompletionDate: string | null = null;

  if (plannedMonthlyRate && plannedMonthlyRate > 0 && remaining > 0) {
    plannedMonthsRemaining = Math.ceil(remaining / plannedMonthlyRate);
    plannedCompletionDate = addMonthsToDate(now, plannedMonthsRemaining).toISOString().split('T')[0]!;
    insightMessages.push(
      `A tu ritmo planificado de ${formatCurrency(plannedMonthlyRate)}/mes, completaras esta meta en ${plannedMonthsRemaining} meses.`,
    );
  }

  // ── Actual pace ───────────────────────────────────────────────
  const actualMonthlyRate = await getActualMonthlyRate(goalId, goal.createdAt);

  let actualMonthsRemaining: number | null = null;
  let actualCompletionDate: string | null = null;

  if (actualMonthlyRate && actualMonthlyRate > 0 && remaining > 0) {
    actualMonthsRemaining = Math.ceil(remaining / actualMonthlyRate);
    actualCompletionDate = addMonthsToDate(now, actualMonthsRemaining).toISOString().split('T')[0]!;
    insightMessages.push(
      `A tu ritmo actual de ${formatCurrency(actualMonthlyRate)}/mes, completaras esta meta en aproximadamente ${actualMonthsRemaining} meses mas.`,
    );
  }

  // ── Pace status ───────────────────────────────────────────────
  let paceStatus: GoalProjection['paceStatus'] = 'no_data';

  if (actualMonthlyRate && actualMonthlyRate > 0) {
    const comparisonRate = plannedMonthlyRate ?? historicalMonthlyRate;
    if (comparisonRate && comparisonRate > 0) {
      if (actualMonthlyRate >= comparisonRate * 1.05) {
        paceStatus = 'ahead';
        if (plannedMonthlyRate) {
          insightMessages.push(
            `Vas adelantado! Tu ritmo actual (${formatCurrency(actualMonthlyRate)}/mes) supera tu plan (${formatCurrency(plannedMonthlyRate)}/mes).`,
          );
        }
      } else if (actualMonthlyRate <= comparisonRate * 0.95) {
        paceStatus = 'behind';
        insightMessages.push('Tu ritmo actual es menor al planificado. Considera ajustar tu plan.');
      } else {
        paceStatus = 'on_track';
      }
    }
  }

  // ── Fallback: no data at all ──────────────────────────────────
  if (insightMessages.length === 0) {
    insightMessages.push(
      'Define un aporte planificado o registra transacciones para ver proyecciones.',
    );
  }

  return {
    goalId: goal.id,
    goalType: goal.type,
    historicalMonthlyRate,
    historicalMonthsRemaining,
    historicalCompletionDate,
    plannedMonthlyRate,
    plannedMonthsRemaining,
    plannedCompletionDate,
    actualMonthlyRate,
    actualMonthsRemaining,
    actualCompletionDate,
    paceStatus,
    insightMessages,
    netMonthlySavings,
    availableBalance,
    totalGoalCommitments,
    isOvercommitted,
    monthsOfData,
  };
}

export { checkAutoComplete };
