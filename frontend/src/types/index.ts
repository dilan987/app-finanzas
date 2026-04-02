// ── Enum-like union types (match backend Prisma enums exactly) ─────

export type TransactionType = 'INCOME' | 'EXPENSE';

export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER';

export type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';

export type InvestmentType = 'STOCKS' | 'CDT' | 'CRYPTO' | 'FUND' | 'FOREX' | 'OTHER';

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

// ── Domain models (match backend Prisma schema) ───────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  mainCurrency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
  userId: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  paymentMethod: PaymentMethod;
  currency: string;
  categoryId: string;
  category?: Category;
  userId: string;
  recurringId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string | null;
  category?: Category;
  userId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  categoryId: string;
  category?: Category;
  userId: string;
  frequency: Frequency;
  nextExecutionDate: string;
  isActive: boolean;
  paymentMethod: PaymentMethod;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  amountInvested: number;
  currentValue: number;
  currency: string;
  startDate: string;
  expectedReturn: number | null;
  notes: string | null;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  message: string;
  severity: Severity;
  category: string;
  isRead: boolean;
  createdAt: string;
}

// ── API response wrappers ─────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// ── Filter types ──────────────────────────────────────────────────

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: TransactionType;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BudgetFilters {
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

export interface RecurringFilters {
  isActive?: boolean;
  type?: TransactionType;
  page?: number;
  limit?: number;
}

export interface InvestmentFilters {
  isActive?: boolean;
  type?: InvestmentType;
  page?: number;
  limit?: number;
}

// ── Analytics types ───────────────────────────────────────────────

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  previousMonth: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
  };
  incomeChange: number;
  expenseChange: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  percentage: number;
  previousTotal: number;
  change: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  income: number;
  expenses: number;
  savingsRate: number;
}

export interface InvestmentSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturn: number;
  returnPercentage: number;
  distribution: Array<{
    type: InvestmentType;
    totalInvested: number;
    totalCurrentValue: number;
    count: number;
    percentage: number;
  }>;
}

// ── Form / create / update DTOs ───────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface CreateTransactionData {
  type: TransactionType;
  amount: number;
  description?: string;
  date: string;
  paymentMethod: PaymentMethod;
  categoryId: string;
  currency?: string;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {}

export interface CreateCategoryData {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CreateBudgetData {
  name?: string;
  type?: TransactionType;
  amount: number;
  categoryId?: string | null;
  month: number;
  year: number;
}

export interface UpdateBudgetData {
  name?: string;
  amount?: number;
}

export interface CreateRecurringData {
  type: TransactionType;
  amount: number;
  description?: string;
  frequency: Frequency;
  nextExecutionDate: string;
  paymentMethod: PaymentMethod;
  categoryId: string;
  currency?: string;
}

export interface UpdateRecurringData extends Partial<CreateRecurringData> {}

export interface CreateInvestmentData {
  name: string;
  type: InvestmentType;
  amountInvested: number;
  currentValue?: number;
  currency?: string;
  startDate: string;
  expectedReturn?: number;
  notes?: string;
}

export interface UpdateInvestmentData extends Partial<CreateInvestmentData> {}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  mainCurrency?: string;
  timezone?: string;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}
