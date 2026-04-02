import { TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export async function getAll(userId: string, type?: TransactionType) {
  const where = {
    OR: [
      { isDefault: true },
      { userId },
    ],
    ...(type ? { type } : {}),
  };

  const categories = await prisma.category.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' },
    ],
  });

  return categories;
}

export async function getById(id: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (!category.isDefault && category.userId !== userId) {
    throw new NotFoundError('Category');
  }

  return category;
}

export async function create(userId: string, data: CreateCategoryInput) {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type,
      isDefault: false,
      userId,
    },
  });

  return category;
}

export async function update(id: string, userId: string, data: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (category.isDefault) {
    throw new ForbiddenError('Default categories cannot be modified');
  }

  if (category.userId !== userId) {
    throw new NotFoundError('Category');
  }

  const updated = await prisma.category.update({
    where: { id },
    data,
  });

  return updated;
}

export async function remove(id: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (category.isDefault) {
    throw new ForbiddenError('Default categories cannot be deleted');
  }

  if (category.userId !== userId) {
    throw new NotFoundError('Category');
  }

  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id },
  });

  if (transactionCount > 0) {
    throw new ConflictError(
      `Cannot delete category: ${transactionCount} transaction(s) still reference it`,
    );
  }

  await prisma.category.delete({
    where: { id },
  });
}
