import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { getPaginationParams, getPaginationMeta, toNumber, roundPercent } from '../../utils/helpers';
import {
  CreateInvestmentInput,
  UpdateInvestmentInput,
  GetInvestmentsQuery,
} from './investments.schema';

async function findOwned(id: string, userId: string) {
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment || investment.userId !== userId) throw new NotFoundError('Investment');
  return investment;
}

export async function getAll(userId: string, filters: GetInvestmentsQuery) {
  const { skip, take, page, limit } = getPaginationParams({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.InvestmentWhereInput = { userId };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.type) where.type = filters.type;

  const [investments, total] = await Promise.all([
    prisma.investment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.investment.count({ where }),
  ]);

  return { investments, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string, userId: string) {
  return findOwned(id, userId);
}

export async function create(userId: string, data: CreateInvestmentInput) {
  return prisma.investment.create({
    data: {
      name: data.name,
      type: data.type,
      amountInvested: data.amountInvested,
      currentValue: data.currentValue ?? data.amountInvested,
      currency: data.currency,
      startDate: new Date(data.startDate),
      expectedReturn: data.expectedReturn,
      notes: data.notes,
      userId,
    },
  });
}

export async function update(id: string, userId: string, data: UpdateInvestmentInput) {
  await findOwned(id, userId);

  const updateData: Prisma.InvestmentUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amountInvested !== undefined) updateData.amountInvested = data.amountInvested;
  if (data.currentValue !== undefined) updateData.currentValue = data.currentValue;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.expectedReturn !== undefined) updateData.expectedReturn = data.expectedReturn;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.investment.update({ where: { id }, data: updateData });
}

export async function remove(id: string, userId: string) {
  await findOwned(id, userId);
  await prisma.investment.delete({ where: { id } });
}

export async function getSummary(userId: string) {
  const investments = await prisma.investment.findMany({
    where: { userId, isActive: true },
  });

  let totalInvested = 0;
  let totalCurrentValue = 0;
  const distributionMap = new Map<string, { type: string; totalInvested: number; currentValue: number; count: number }>();

  for (const inv of investments) {
    const invested = toNumber(inv.amountInvested);
    const current = toNumber(inv.currentValue);
    totalInvested += invested;
    totalCurrentValue += current;

    const existing = distributionMap.get(inv.type);
    if (existing) {
      existing.totalInvested += invested;
      existing.currentValue += current;
      existing.count++;
    } else {
      distributionMap.set(inv.type, { type: inv.type, totalInvested: invested, currentValue: current, count: 1 });
    }
  }

  const totalReturn = totalCurrentValue - totalInvested;

  return {
    totalInvested,
    totalCurrentValue,
    totalReturn,
    totalReturnPercentage: roundPercent(totalReturn, totalInvested),
    activeInvestments: investments.length,
    distribution: Array.from(distributionMap.values()).map((item) => ({
      ...item,
      percentage: roundPercent(item.totalInvested, totalInvested),
    })),
  };
}
