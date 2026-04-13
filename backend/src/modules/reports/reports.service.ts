import PDFDocument from 'pdfkit';
import { TransactionType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { formatCurrency, getMonthName } from '../../utils/helpers';

interface CSVFilters {
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  DEBIT_CARD: 'Tarjeta Débito',
  CREDIT_CARD: 'Tarjeta Crédito',
  TRANSFER: 'Transferencia',
};

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
};

export async function generatePDF(userId: string, month: number, year: number): Promise<Buffer> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const [incomeResult, expenseResult, topCategories] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    }),
  ]);

  const totalIncome = incomeResult._sum.amount?.toNumber() ?? 0;
  const totalExpenses = expenseResult._sum.amount?.toNumber() ?? 0;
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 10000) / 100
    : 0;

  // Fetch category names for top categories (filter null categoryIds from transfers)
  const categoryIds = topCategories.map((c) => c.categoryId).filter((id): id is string => id !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const periodLabel = `${getMonthName(month)} ${year}`;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('Finanzas App', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica').text(`Reporte Financiero - ${periodLabel}`, { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#CCCCCC');
    doc.moveDown(1);

    // Summary table
    doc.fontSize(16).font('Helvetica-Bold').text('Resumen de Ingresos y Gastos');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 350;

    doc.fontSize(11).font('Helvetica');

    // Table rows
    const rows: Array<[string, string]> = [
      ['Total Ingresos', formatCurrency(totalIncome)],
      ['Total Gastos', formatCurrency(totalExpenses)],
      ['Balance', formatCurrency(balance)],
      ['Tasa de Ahorro', `${savingsRate}%`],
      ['Transacciones de Ingreso', String(incomeResult._count)],
      ['Transacciones de Gasto', String(expenseResult._count)],
    ];

    let rowY = tableTop;
    for (const [label, value] of rows) {
      // Alternate row background
      const rowIndex = rows.indexOf([label, value]);
      if (rowIndex % 2 === 0) {
        doc.rect(col1 - 5, rowY - 2, 500, 18).fill('#F9FAFB').stroke();
        doc.fillColor('#000000');
      }
      doc.font('Helvetica-Bold').text(label, col1, rowY, { width: 280 });
      doc.font('Helvetica').text(value, col2, rowY, { width: 195, align: 'right' });
      rowY += 22;
    }

    doc.y = rowY + 10;
    doc.moveDown(1);

    // Top 5 expense categories
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Top 5 Categorías de Gasto');
    doc.moveDown(0.5);

    if (topCategories.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No hay gastos registrados en este período.');
    } else {
      // Table header
      const catTableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.rect(45, catTableTop - 4, 500, 20).fill('#E5E7EB').stroke();
      doc.fillColor('#000000');
      doc.text('#', 50, catTableTop, { width: 30 });
      doc.text('Categoría', 80, catTableTop, { width: 250 });
      doc.text('Monto', 330, catTableTop, { width: 100, align: 'right' });
      doc.text('% del Total', 440, catTableTop, { width: 100, align: 'right' });

      let catRowY = catTableTop + 24;
      doc.font('Helvetica').fontSize(10);

      for (let i = 0; i < topCategories.length; i++) {
        const cat = topCategories[i];
        const amount = cat._sum.amount?.toNumber() ?? 0;
        const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 10000) / 100 : 0;
        const catName = (cat.categoryId ? categoryMap.get(cat.categoryId) : null) ?? 'Sin categoría';

        if (i % 2 === 0) {
          doc.rect(45, catRowY - 4, 500, 18).fill('#F9FAFB').stroke();
          doc.fillColor('#000000');
        }

        doc.text(String(i + 1), 50, catRowY, { width: 30 });
        doc.text(catName, 80, catRowY, { width: 250 });
        doc.text(formatCurrency(amount), 330, catRowY, { width: 100, align: 'right' });
        doc.text(`${pct}%`, 440, catRowY, { width: 100, align: 'right' });

        catRowY += 22;
      }

      doc.y = catRowY + 10;
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#999999')
      .text(
        `Generado el ${new Date().toLocaleDateString('es-CO')} - Finanzas App`,
        { align: 'center' },
      );

    doc.end();
  });
}

export async function generateCSV(userId: string, filters: CSVFilters): Promise<string> {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod as Prisma.EnumPaymentMethodFilter;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate);
    }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) {
      where.amount.gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      where.amount.lte = filters.maxAmount;
    }
  }

  if (filters.search) {
    where.description = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const header = 'Fecha,Tipo,Categoría,Descripción,Monto,Método de Pago,Moneda';

  const rows = transactions.map((t) => {
    const date = new Date(t.date).toLocaleDateString('es-CO');
    const type = TYPE_LABELS[t.type] ?? t.type;
    const categoryName = escapeCSV(t.category?.name ?? 'Transferencia');
    const description = escapeCSV(t.description ?? '');
    const amount = t.amount.toNumber().toString();
    const paymentMethod = PAYMENT_METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod;
    const currency = t.currency;

    return `${date},${type},${categoryName},${description},${amount},${paymentMethod},${currency}`;
  });

  return [header, ...rows].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
