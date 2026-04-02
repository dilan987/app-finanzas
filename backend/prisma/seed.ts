import { PrismaClient, TransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

const expenseCategories: CategorySeed[] = [
  { name: 'Alimentación', icon: 'shopping-cart', color: '#EF4444', type: TransactionType.EXPENSE },
  { name: 'Transporte', icon: 'car', color: '#F59E0B', type: TransactionType.EXPENSE },
  { name: 'Vivienda/Alquiler', icon: 'home', color: '#8B5CF6', type: TransactionType.EXPENSE },
  { name: 'Servicios', icon: 'zap', color: '#3B82F6', type: TransactionType.EXPENSE },
  { name: 'Salud', icon: 'heart', color: '#EC4899', type: TransactionType.EXPENSE },
  { name: 'Entretenimiento', icon: 'film', color: '#F97316', type: TransactionType.EXPENSE },
  { name: 'Ropa', icon: 'shirt', color: '#14B8A6', type: TransactionType.EXPENSE },
  { name: 'Educación', icon: 'book-open', color: '#6366F1', type: TransactionType.EXPENSE },
  { name: 'Restaurantes', icon: 'utensils', color: '#E11D48', type: TransactionType.EXPENSE },
  { name: 'Suscripciones', icon: 'credit-card', color: '#7C3AED', type: TransactionType.EXPENSE },
  { name: 'Deudas/Préstamos', icon: 'landmark', color: '#DC2626', type: TransactionType.EXPENSE },
  { name: 'Mascotas', icon: 'paw-print', color: '#A855F7', type: TransactionType.EXPENSE },
  { name: 'Otros', icon: 'tag', color: '#6B7280', type: TransactionType.EXPENSE },
];

const incomeCategories: CategorySeed[] = [
  { name: 'Salario', icon: 'briefcase', color: '#10B981', type: TransactionType.INCOME },
  { name: 'Freelance', icon: 'laptop', color: '#06B6D4', type: TransactionType.INCOME },
  { name: 'Inversiones', icon: 'trending-up', color: '#22C55E', type: TransactionType.INCOME },
  { name: 'Ventas', icon: 'shopping-bag', color: '#84CC16', type: TransactionType.INCOME },
  { name: 'Regalos', icon: 'gift', color: '#F472B6', type: TransactionType.INCOME },
  { name: 'Otros', icon: 'tag', color: '#6B7280', type: TransactionType.INCOME },
];

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Seed default categories
  const allCategories = [...expenseCategories, ...incomeCategories];

  for (const category of allCategories) {
    await prisma.category.upsert({
      where: {
        id: `default-${category.type.toLowerCase()}-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      },
      update: {
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        isDefault: true,
      },
      create: {
        id: `default-${category.type.toLowerCase()}-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        isDefault: true,
        userId: null,
      },
    });
  }

  console.log(`Seeded ${allCategories.length} default categories`);

  // Seed test user
  const passwordHash = await bcrypt.hash('admin', 12);

  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      name: 'Admin',
      passwordHash,
    },
    create: {
      email: 'admin@admin.com',
      passwordHash,
      name: 'Admin',
      mainCurrency: 'COP',
      timezone: 'America/Bogota',
    },
  });

  console.log('Seeded test user: admin@admin.com / admin');
  console.log('Seed completed successfully');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
