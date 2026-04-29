import { TransactionType, PaymentMethod } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { toNumber } from '../../utils/helpers';
import {
  computeBiweeklyRanges,
  type BiweeklyMode,
  type BiweeklyRange,
} from '../../utils/biweekly';

export interface CashflowEntry {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string | null;
  category: { id: string; name: string; color: string; icon: string } | null;
  account: { id: string; name: string } | null;
  paymentMethod: PaymentMethod;
}

export interface CashflowBucket {
  half: 1 | 2;
  rangeStart: string;
  rangeEnd: string;
  rangeLabel: string;
  entries: CashflowEntry[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface CashflowResponse {
  month: number;
  year: number;
  mode: BiweeklyMode;
  buckets: [CashflowBucket, CashflowBucket];
  monthTotals: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
}

export async function getBiweeklyCashflow(
  userId: string,
  month: number,
  year: number,
): Promise<CashflowResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      biweeklyCustomEnabled: true,
      biweeklyStartDay1: true,
      biweeklyStartDay2: true,
    },
  });

  if (!user) throw new NotFoundError('User');

  const mode: BiweeklyMode = user.biweeklyCustomEnabled ? 'custom' : 'calendar';
  const ranges = computeBiweeklyRanges(
    month,
    year,
    mode,
    user.biweeklyStartDay1,
    user.biweeklyStartDay2,
  );

  const [q1Bucket, q2Bucket] = await Promise.all([
    buildBucket(userId, 1, ranges.q1),
    buildBucket(userId, 2, ranges.q2),
  ]);

  return {
    month,
    year,
    mode,
    buckets: [q1Bucket, q2Bucket],
    monthTotals: {
      totalIncome: q1Bucket.totalIncome + q2Bucket.totalIncome,
      totalExpense: q1Bucket.totalExpense + q2Bucket.totalExpense,
      netBalance: q1Bucket.netBalance + q2Bucket.netBalance,
    },
  };
}

async function buildBucket(
  userId: string,
  half: 1 | 2,
  range: BiweeklyRange,
): Promise<CashflowBucket> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: range.start, lte: range.end },
    },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
      account: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  });

  const entries: CashflowEntry[] = transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    type: t.type,
    amount: toNumber(t.amount),
    currency: t.currency,
    description: t.description,
    category: t.category
      ? {
          id: t.category.id,
          name: t.category.name,
          color: t.category.color,
          icon: t.category.icon,
        }
      : null,
    account: t.account ? { id: t.account.id, name: t.account.name } : null,
    paymentMethod: t.paymentMethod,
  }));

  let totalIncome = 0;
  let totalExpense = 0;
  for (const e of entries) {
    if (e.type === 'INCOME') totalIncome += e.amount;
    else if (e.type === 'EXPENSE') totalExpense += e.amount;
  }

  return {
    half,
    rangeStart: range.start.toISOString(),
    rangeEnd: range.end.toISOString(),
    rangeLabel: range.label,
    entries,
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
}
