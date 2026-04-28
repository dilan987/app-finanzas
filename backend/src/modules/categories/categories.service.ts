import { TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

async function findOwnedCategory(id: string, userId: string) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) throw new NotFoundError('Category');
  if (!category.isDefault && category.userId !== userId) throw new NotFoundError('Category');

  return category;
}

export async function getAll(userId: string, type?: TransactionType) {
  return prisma.category.findMany({
    where: {
      OR: [{ isDefault: true }, { userId }],
      ...(type ? { type } : {}),
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

export async function getById(id: string, userId: string) {
  return findOwnedCategory(id, userId);
}

export async function create(userId: string, data: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type,
      isDefault: false,
      userId,
    },
  });
}

export async function update(id: string, userId: string, data: UpdateCategoryInput) {
  const category = await findOwnedCategory(id, userId);

  if (category.isDefault) {
    throw new ForbiddenError('Default categories cannot be modified');
  }

  return prisma.category.update({ where: { id }, data });
}

export async function remove(id: string, userId: string) {
  const category = await findOwnedCategory(id, userId);

  if (category.isDefault) {
    throw new ForbiddenError('Default categories cannot be deleted');
  }

  const transactionCount = await prisma.transaction.count({ where: { categoryId: id } });

  if (transactionCount > 0) {
    throw new ConflictError(
      `Cannot delete category: ${transactionCount} transaction(s) still reference it`,
    );
  }

  await prisma.category.delete({ where: { id } });
}
