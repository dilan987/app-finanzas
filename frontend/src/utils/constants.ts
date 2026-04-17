import type { PaymentMethod, Frequency, InvestmentType, Severity, AccountType, GoalType, GoalStatus, ContributionFrequency } from '../types';

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
  TRANSFER: 'Transferencia',
};

export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'CHECKING', label: 'Cuenta corriente', icon: 'HiBuildingOffice' },
  { value: 'SAVINGS', label: 'Cuenta de ahorros', icon: 'HiBanknotes' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de credito', icon: 'HiCreditCard' },
  { value: 'CASH', label: 'Efectivo', icon: 'HiBanknotes' },
  { value: 'NEOBANK', label: 'Neobanco', icon: 'HiDevicePhoneMobile' },
  { value: 'INVESTMENT', label: 'Inversion', icon: 'HiChartBar' },
  { value: 'LOAN', label: 'Prestamo', icon: 'HiDocumentText' },
  { value: 'OTHER', label: 'Otro', icon: 'HiWallet' },
];

export const ACCOUNT_COLORS: string[] = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export const GOAL_TYPES: { value: GoalType; label: string; icon: string }[] = [
  { value: 'DEBT', label: 'Deuda', icon: 'HiCreditCard' },
  { value: 'SAVINGS', label: 'Ahorro', icon: 'HiBanknotes' },
];

export const GOAL_STATUSES: { value: GoalStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Activa', color: '#3b82f6' },
  { value: 'COMPLETED', label: 'Completada', color: '#22c55e' },
  { value: 'CANCELLED', label: 'Cancelada', color: '#78716c' },
];

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  ACTIVE: '#3b82f6',
  COMPLETED: '#22c55e',
  CANCELLED: '#78716c',
};

export const CONTRIBUTION_FREQUENCIES: { value: ContributionFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY', label: 'Mensual' },
];

export const ITEMS_PER_PAGE = 20;
