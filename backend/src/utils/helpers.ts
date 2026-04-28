import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ── Pagination ─────────────────────────────────────────────────────

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export function getPaginationParams(params: PaginationParams): PaginationResult {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, params.limit ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

export function getPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ── Date Utilities ─────────────────────────────────────────────────

export function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

export function getDateRange(
  startDate: string | Date,
  endDate: string | Date,
): { start: Date; end: Date } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ── Financial Calculations ─────────────────────────────────────────

export function getBalanceDelta(type: TransactionType | string, amount: number): number {
  switch (type) {
    case 'INCOME':
      return amount;
    case 'EXPENSE':
    case 'TRANSFER':
      return -amount;
    default:
      return 0;
  }
}

export function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

export function calcSavingsRate(income: number, expenses: number): number {
  if (income === 0) return 0;
  return Math.round(((income - expenses) / income) * 10000) / 100;
}

export function roundPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}

// ── Decimal Serialization ──────────────────────────────────────────

export function toNumber(value: Decimal | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return (value as Decimal).toNumber();
}

export function serializeDecimalFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (val != null && typeof val === 'object' && 'toNumber' in (val as object)) {
      (result as Record<string, unknown>)[field as string] = (val as unknown as Decimal).toNumber();
    }
  }
  return result;
}

// ── Formatting ─────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return months[month - 1] ?? 'Desconocido';
}
