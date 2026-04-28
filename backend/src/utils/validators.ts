import { TransactionType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from './errors';

export async function verifyOwnership<T extends { userId: string }>(
  model: { findUnique: (args: { where: { id: string } }) => Promise<T | null> },
  id: string,
  userId: string,
  resourceName: string,
): Promise<T> {
  const entity = await model.findUnique({ where: { id } });

  if (!entity || entity.userId !== userId) {
    throw new NotFoundError(resourceName);
  }

  return entity;
}

export async function validateCategory(categoryId: string, userId: string): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (!category.isDefault && category.userId !== userId) {
    throw new ForbiddenError('You do not have access to this category');
  }
}

export async function validateAccount(accountId: string, userId: string): Promise<void> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });

  if (!account || account.userId !== userId) {
    throw new NotFoundError('Account');
  }
}

export async function validateGoalForTransaction(
  goalId: string,
  userId: string,
  transactionType: TransactionType,
): Promise<void> {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });

  if (!goal || goal.userId !== userId) {
    throw new NotFoundError('Goal');
  }

  if (goal.status !== 'ACTIVE') {
    throw new ForbiddenError('Cannot link transactions to a non-active goal');
  }

  const validType = goal.type === 'DEBT' ? 'EXPENSE' : 'INCOME';
  if (transactionType !== validType) {
    throw new ForbiddenError(
      `Only ${validType} transactions can be linked to ${goal.type} goals`,
    );
  }
}
