import type { PaymentMethod, Frequency, InvestmentType, Severity } from '../types';

export const DEFAULT_CURRENCY = 'COP' as const;

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito' },
  { value: 'DEBIT_CARD', label: 'Tarjeta débito' },
  { value: 'TRANSFER', label: 'Transferencia' },
];

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'DAILY', label: 'Diario' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'YEARLY', label: 'Anual' },
];

export const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'STOCKS', label: 'Acciones' },
  { value: 'CDT', label: 'CDT' },
  { value: 'CRYPTO', label: 'Criptomonedas' },
  { value: 'FUND', label: 'Fondo' },
  { value: 'FOREX', label: 'Forex' },
  { value: 'OTHER', label: 'Otro' },
];

export const CATEGORY_ICONS: string[] = [
  'HiHome',
  'HiShoppingCart',
  'HiTruck',
  'HiBolt',
  'HiHeart',
  'HiAcademicCap',
  'HiFilm',
  'HiMusicalNote',
  'HiGift',
  'HiWrench',
  'HiPhone',
  'HiGlobeAlt',
  'HiBanknotes',
  'HiBriefcase',
  'HiCreditCard',
  'HiBuildingOffice',
  'HiCake',
  'HiShieldCheck',
  'HiSparkles',
  'HiStar',
  'HiTag',
  'HiUsers',
  'HiWifi',
  'HiComputerDesktop',
];

export const CATEGORY_COLORS: string[] = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
  '#64748b',
  '#0d9488',
];

export const SEVERITY_COLORS: Record<Severity, string> = {
  INFO: '#22c55e',
  WARNING: '#f59e0b',
  CRITICAL: '#ef4444',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
};

export const ITEMS_PER_PAGE = 20;
