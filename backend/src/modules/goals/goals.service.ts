import { Prisma, GoalStatus, ContributionFrequency } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, AppError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta, formatCurrency, toNumber, roundPercent } from '../../utils/helpers';
import {
  CreateGoalInput,
  UpdateGoalInput,
  GetGoalsQuery,
} from './goals.schema';

// ── Helpers ────────────────────────────────────────────────────────

function calculateProjectedEnd(startMonth: number, startYear: number, installments: number) {
  const totalMonths = startYear * 12 + startMonth - 1 + installments - 1;
  return {
    projectedEndMonth: (totalMonths % 12) + 1,
    projectedEndYear: Math.floor(totalMonths / 12),
  };
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

function serializeGoal(goal: Record<string, unknown>) {
  return {
    ...goal,
    targetAmount: toNumber(goal.targetAmount as any),
    suggestedInstallment: goal.suggestedInstallment != null ? toNumber(goal.suggestedInstallment as any) : null,
    plannedContribution: goal.plannedContribution != null ? toNumber(goal.plannedContribution as any) : null,
    contributionFrequency: goal.contributionFrequency ?? null,
    plannedInstallments: goal.plannedInstallments ?? null,
    startMonth: goal.startMonth ?? null,
    startYear: goal.startYear ?? null,
    projectedEndMonth: goal.projectedEndMonth ?? null,
    projectedEndYear: goal.projectedEndYear ?? null,
  };
}

async function getGoalProgress(goalId: string): Promise<{ totalPaid: number; progress: number; target: number }> {
  const [goal, result] = await Promise.all([
    prisma.goal.findUnique({ where: { id: goalId } }),
    prisma.transaction.aggregate({ where: { goalId }, _sum: { amount: true } }),
  ]);
  const target = toNumber(goal?.targetAmount);
  const totalPaid = toNumber(result._sum.amount);
  return { totalPaid, progress: roundPercent(totalPaid, target), target };
}

async function findOwned(id: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) throw new NotFoundError('Goal');
  return goal;
}

async function checkAutoComplete(goalId: string): Promise<boolean> {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.status !== 'ACTIVE') return false;

  const result = await prisma.transaction.aggregate({ where: { goalId }, _sum: { amount: true } });
  const totalPaid = toNumber(result._sum.amount);

  if (totalPaid >= toNumber(goal.targetAmount)) {
    await prisma.goal.update({ where: { id: goalId }, data: { status: 'COMPLETED' } });
    return true;
  }
  return false;
}

// ── Queries ────────────────────────────────────────────────────────

export async function getAll(userId: string, filters: GetGoalsQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.GoalWhereInput = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  const [goals, total] = await Promise.all([
    prisma.goal.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.goal.count({ where }),
  ]);

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const result = await prisma.transaction.aggregate({ where: { goalId: goal.id }, _sum: { amount: true } });
      const totalPaid = toNumber(result._sum.amount);
      const target = toNumber(goal.targetAmount);
      return { ...serializeGoal(goal as any), totalPaid, progress: roundPercent(totalPaid, target) };
    }),
  );

  return { goals: goalsWithProgress, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string, userId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { transactions: { include: { category: true, account: true }, orderBy: { date: 'desc' } } },
  });

  if (!goal || goal.userId !== userId) throw new NotFoundError('Goal');

  const totalPaid = goal.transactions.reduce((sum, tx) => sum + toNumber(tx.amount), 0);
  const target = toNumber(goal.targetAmount);

  return {
    ...serializeGoal(goal as any),
    totalPaid,
    progress: roundPercent(totalPaid, target),
    transactions: goal.transactions.map((tx) => ({ ...tx, amount: toNumber(tx.amount) })),
  };
}

// ── Create ─────────────────────────────────────────────────────────

export async function create(userId: string, data: CreateGoalInput) {
  if (data.type === 'DEBT') {
    const suggestedInstallment = calculateSuggestedInstallment(data.targetAmount, data.plannedInstallments);
    const { projectedEndMonth, projectedEndYear } = calculateProjectedEnd(data.startMonth, data.startYear, data.plannedInstallments);

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

    return { ...serializeGoal(goal as any), totalPaid: 0, progress: 0 };
  }

  const hasFreq = 'contributionFrequency' in data && data.contributionFrequency !== undefined;
  const hasAmount = 'plannedContribution' in data && data.plannedContribution !== undefined;
  if (hasFreq !== hasAmount) {
    throw new AppError('Both contributionFrequency and plannedContribution must be provided together', 400);
  }

  const goal = await prisma.goal.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      type: 'SAVINGS',
      targetAmount: data.targetAmount,
      contributionFrequency: hasFreq ? (data as any).contributionFrequency : null,
      plannedContribution: hasAmount ? (data as any).plannedContribution : null,
      plannedInstallments: null,
      suggestedInstallment: null,
      startMonth: null,
      startYear: null,
      projectedEndMonth: null,
      projectedEndYear: null,
      userId,
    },
  });

  return { ...serializeGoal(goal as any), totalPaid: 0, progress: 0 };
}

// ── Update ─────────────────────────────────────────────────────────

export async function update(id: string, userId: string, data: UpdateGoalInput) {
  const goal = await findOwned(id, userId);

  const updateData: Prisma.GoalUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  if (goal.type === 'DEBT' && data.plannedInstallments !== undefined) {
    const target = toNumber(goal.targetAmount);
    updateData.plannedInstallments = data.plannedInstallments;
    updateData.suggestedInstallment = calculateSuggestedInstallment(target, data.plannedInstallments);
    const { projectedEndMonth, projectedEndYear } = calculateProjectedEnd(goal.startMonth!, goal.startYear!, data.plannedInstallments);
    updateData.projectedEndMonth = projectedEndMonth;
    updateData.projectedEndYear = projectedEndYear;
  } else if (goal.type === 'SAVINGS') {
    if (data.contributionFrequency !== undefined) updateData.contributionFrequency = data.contributionFrequency;
    if (data.plannedContribution !== undefined) updateData.plannedContribution = data.plannedContribution;
  }

  const updated = await prisma.goal.update({ where: { id }, data: updateData });
  const { totalPaid, progress } = await getGoalProgress(id);

  return { ...serializeGoal(updated as any), totalPaid, progress };
}

// ── Cancel ─────────────────────────────────────────────────────────

export async function cancel(id: string, userId: string) {
  await findOwned(id, userId);
  const updated = await prisma.goal.update({ where: { id }, data: { status: GoalStatus.CANCELLED } });
  return serializeGoal(updated as any);
}

// ── Link/Unlink Transactions ───────────────────────────────────────

export async function linkTransaction(goalId: string, transactionId: string, userId: string) {
  const goal = await findOwned(goalId, userId);
  if (goal.status !== 'ACTIVE') throw new AppError('Cannot link transactions to a non-active goal', 400);

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction || transaction.userId !== userId) throw new NotFoundError('Transaction');
  if (transaction.goalId) throw new AppError('Transaction is already linked to a goal', 400);

  const validType = goal.type === 'DEBT' ? 'EXPENSE' : 'INCOME';
  if (transaction.type !== validType) {
    throw new AppError(`Only ${validType} transactions can be linked to ${goal.type} goals`, 400);
  }

  await prisma.transaction.update({ where: { id: transactionId }, data: { goalId } });
  const completed = await checkAutoComplete(goalId);

  return { linked: true, goalCompleted: completed };
}

export async function unlinkTransaction(goalId: string, transactionId: string, userId: string) {
  await findOwned(goalId, userId);

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction) throw new NotFoundError('Transaction');
  if (transaction.goalId !== goalId) throw new AppError('Transaction is not linked to this goal', 400);

  await prisma.transaction.update({ where: { id: transactionId }, data: { goalId: null } });
  return { unlinked: true };
}

// ── Active for Month ───────────────────────────────────────────────

function filterGoalsForMonth(goals: Awaited<ReturnType<typeof prisma.goal.findMany>>, month: number, year: number) {
  const targetDate = year * 12 + month;
  return goals.filter((g) => {
    if (g.type === 'SAVINGS') return true;
    if (g.startMonth == null || g.startYear == null || g.projectedEndMonth == null || g.projectedEndYear == null) return true;
    const gStart = g.startYear * 12 + g.startMonth;
    const gEnd = g.projectedEndYear * 12 + g.projectedEndMonth;
    return targetDate >= gStart && targetDate <= gEnd;
  });
}

export async function getActiveForMonth(userId: string, month: number, year: number) {
  const goals = await prisma.goal.findMany({ where: { userId, status: 'ACTIVE' } });
  const activeGoals = filterGoalsForMonth(goals, month, year);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const result = await Promise.all(
    activeGoals.map(async (goal) => {
      const [totalResult, monthResult] = await Promise.all([
        prisma.transaction.aggregate({ where: { goalId: goal.id }, _sum: { amount: true } }),
        prisma.transaction.aggregate({
          where: { goalId: goal.id, date: { gte: startOfMonth, lte: endOfMonth } },
          _sum: { amount: true },
        }),
      ]);

      const target = toNumber(goal.targetAmount);
      const totalPaid = toNumber(totalResult._sum.amount);

      return {
        id: goal.id,
        name: goal.name,
        type: goal.type,
        status: goal.status,
        targetAmount: target,
        suggestedInstallment: goal.suggestedInstallment != null ? toNumber(goal.suggestedInstallment) : null,
        totalPaid,
        paidThisMonth: toNumber(monthResult._sum.amount),
        progress: roundPercent(totalPaid, target),
        startMonth: goal.startMonth ?? null,
        startYear: goal.startYear ?? null,
        projectedEndMonth: goal.projectedEndMonth ?? null,
        projectedEndYear: goal.projectedEndYear ?? null,
        plannedInstallments: goal.plannedInstallments ?? null,
        contributionFrequency: goal.contributionFrequency ?? null,
        plannedContribution: goal.plannedContribution != null ? toNumber(goal.plannedContribution) : null,
      };
    }),
  );

  const totalCommitment = result.reduce((sum, g) => {
    if (g.type === 'DEBT' && g.suggestedInstallment != null) return sum + g.suggestedInstallment;
    if (g.type === 'SAVINGS' && g.contributionFrequency && g.plannedContribution != null) {
      return sum + g.plannedContribution * frequencyToMonthlyMultiplier(g.contributionFrequency as ContributionFrequency);
    }
    return sum;
  }, 0);

  return {
    goals: result,
    totalCommitment,
    totalPaidThisMonth: result.reduce((sum, g) => sum + g.paidThisMonth, 0),
  };
}

// ── Projection Engine ──────────────────────────────────────────────

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
  netMonthlySavings: number | null;
  availableBalance: number;
  totalGoalCommitments: number;
  isOvercommitted: boolean;
  monthsOfData: number;
}

async function getNetMonthlySavings(userId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: { in: ['INCOME', 'EXPENSE'] }, date: { gte: sixMonthsAgo } },
    select: { amount: true, date: true, type: true },
  });

  if (transactions.length === 0) return null;

  const monthlyNet = new Map<string, number>();
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const val = tx.type === 'INCOME' ? toNumber(tx.amount) : -toNumber(tx.amount);
    monthlyNet.set(key, (monthlyNet.get(key) ?? 0) + val);
  }

  if (monthlyNet.size === 0) return null;

  const sorted = Array.from(monthlyNet.entries()).sort((a, b) => {
    const [aY, aM] = a[0].split('-').map(Number);
    const [bY, bM] = b[0].split('-').map(Number);
    return (bY! * 12 + bM!) - (aY! * 12 + aM!);
  });

  const midpoint = Math.ceil(sorted.length / 2);
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < sorted.length; i++) {
    const weight = i < midpoint ? 2 : 1;
    weightedSum += sorted[i]![1] * weight;
    totalWeight += weight;
  }

  return { netMonthlySavings: Math.round(weightedSum / totalWeight), monthsOfData: sorted.length };
}

async function getAvailableBalance(userId: string): Promise<number> {
  const result = await prisma.account.aggregate({
    where: { userId, isActive: true, includeInTotal: true },
    _sum: { currentBalance: true },
  });
  return toNumber(result._sum.currentBalance);
}

async function getTotalGoalCommitments(userId: string, excludeGoalId: string): Promise<number> {
  const otherGoals = await prisma.goal.findMany({
    where: { userId, status: 'ACTIVE', id: { not: excludeGoalId } },
  });

  return otherGoals.reduce((total, g) => {
    if (g.type === 'DEBT' && g.suggestedInstallment != null) return total + toNumber(g.suggestedInstallment);
    if (g.type === 'SAVINGS' && g.contributionFrequency && g.plannedContribution != null) {
      return total + toNumber(g.plannedContribution) * frequencyToMonthlyMultiplier(g.contributionFrequency);
    }
    return total;
  }, 0);
}

async function getActualMonthlyRate(goalId: string, createdAt: Date): Promise<number | null> {
  const result = await prisma.transaction.aggregate({ where: { goalId }, _sum: { amount: true } });
  const totalPaid = toNumber(result._sum.amount);
  if (totalPaid <= 0) return null;

  const now = new Date();
  const monthsElapsed = Math.max(1, (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth()) || 1);
  return Math.round(totalPaid / monthsElapsed);
}

function buildCompletionProjection(remaining: number, monthlyRate: number | null, now: Date) {
  if (!monthlyRate || monthlyRate <= 0 || remaining <= 0) return { months: null, date: null };
  const months = Math.ceil(remaining / monthlyRate);
  return { months, date: addMonthsToDate(now, months).toISOString().split('T')[0]! };
}

function buildSavingsInsights(
  netMonthlySavings: number | null,
  monthsOfData: number,
  remaining: number,
  availableBalance: number,
  isOvercommitted: boolean,
  totalGoalCommitments: number,
) {
  const messages: string[] = [];

  if (netMonthlySavings !== null && netMonthlySavings > 0 && remaining > 0) {
    const months = Math.ceil(remaining / netMonthlySavings);
    messages.push(
      `Segun tu ahorro neto promedio de ${formatCurrency(netMonthlySavings)}/mes (ingresos - gastos), podrias alcanzar esta meta en aproximadamente ${months} meses.`,
    );
    if (monthsOfData <= 1) {
      messages.push(`Basado en solo ${monthsOfData} mes de datos. La precision mejorara con mas historial.`);
    }
  } else if (netMonthlySavings !== null && netMonthlySavings === 0) {
    messages.push('Tu ahorro neto es $0/mes. Reduce gastos o aumenta ingresos para avanzar en esta meta.');
  } else if (netMonthlySavings !== null && netMonthlySavings < 0) {
    messages.push('Tu promedio de gastos supera tus ingresos. Revisa tu presupuesto para poder ahorrar hacia esta meta.');
  } else {
    messages.push('Registra transacciones de ingreso y gasto para obtener proyecciones basadas en tu ahorro neto.');
  }

  if (availableBalance > 0 && remaining > 0) {
    if (availableBalance >= remaining) {
      messages.push('Tu saldo actual ya cubre esta meta. Puedes completarla cuando quieras!');
    } else {
      const gap = remaining - availableBalance;
      const monthsSuffix = netMonthlySavings && netMonthlySavings > 0
        ? ` (~${Math.ceil(gap / netMonthlySavings)} meses a tu ritmo actual)`
        : '';
      messages.push(`Con tu saldo disponible de ${formatCurrency(availableBalance)}, necesitarias ahorrar ${formatCurrency(gap)} adicionales${monthsSuffix}.`);
    }
  }

  if (isOvercommitted) {
    messages.push(
      `Tus compromisos totales en metas (${formatCurrency(totalGoalCommitments)}/mes) superan tu ahorro neto (${formatCurrency(netMonthlySavings!)}/ mes). Considera priorizar tus metas.`,
    );
  }

  return messages;
}

export async function getProjection(goalId: string, userId: string): Promise<GoalProjection> {
  const goal = await findOwned(goalId, userId);
  const target = toNumber(goal.targetAmount);

  const aggResult = await prisma.transaction.aggregate({ where: { goalId }, _sum: { amount: true } });
  const totalPaid = toNumber(aggResult._sum.amount);
  const remaining = Math.max(0, target - totalPaid);

  const now = new Date();
  const insightMessages: string[] = [];

  if (remaining > 0 && remaining <= target * 0.1) {
    insightMessages.push(`Estas a solo ${formatCurrency(remaining)} de completar tu meta!`);
  }

  let netMonthlySavings: number | null = null;
  let monthsOfData = 0;
  let availableBalance = 0;
  let totalGoalCommitments = 0;
  let isOvercommitted = false;

  if (goal.type === 'SAVINGS') {
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

    insightMessages.push(...buildSavingsInsights(
      netMonthlySavings, monthsOfData, remaining, availableBalance, isOvercommitted, totalGoalCommitments,
    ));
  }

  const historicalMonthlyRate = netMonthlySavings;
  const historical = buildCompletionProjection(remaining, historicalMonthlyRate, now);

  const plannedMonthlyRate = goal.contributionFrequency && goal.plannedContribution != null
    ? toNumber(goal.plannedContribution) * frequencyToMonthlyMultiplier(goal.contributionFrequency)
    : null;
  const planned = buildCompletionProjection(remaining, plannedMonthlyRate, now);
  if (planned.months) {
    insightMessages.push(
      `A tu ritmo planificado de ${formatCurrency(plannedMonthlyRate!)}/mes, completaras esta meta en ${planned.months} meses.`,
    );
  }

  const actualMonthlyRate = await getActualMonthlyRate(goalId, goal.createdAt);
  const actual = buildCompletionProjection(remaining, actualMonthlyRate, now);
  if (actual.months) {
    insightMessages.push(
      `A tu ritmo actual de ${formatCurrency(actualMonthlyRate!)}/mes, completaras esta meta en aproximadamente ${actual.months} meses mas.`,
    );
  }

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

  if (insightMessages.length === 0) {
    insightMessages.push('Define un aporte planificado o registra transacciones para ver proyecciones.');
  }

  return {
    goalId: goal.id,
    goalType: goal.type,
    historicalMonthlyRate,
    historicalMonthsRemaining: historical.months,
    historicalCompletionDate: historical.date,
    plannedMonthlyRate,
    plannedMonthsRemaining: planned.months,
    plannedCompletionDate: planned.date,
    actualMonthlyRate,
    actualMonthsRemaining: actual.months,
    actualCompletionDate: actual.date,
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
