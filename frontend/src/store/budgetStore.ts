import { create } from 'zustand';
import type {
  Budget,
  BudgetSummary,
  BudgetFilters,
  CreateBudgetData,
  UpdateBudgetData,
} from '../types';
import { budgetsApi } from '../api/budgets.api';

interface BudgetState {
  budgets: Budget[];
  summary: BudgetSummary[];
  loading: boolean;

  fetchBudgets: (filters?: BudgetFilters) => Promise<void>;
  createBudget: (data: CreateBudgetData) => Promise<Budget>;
  updateBudget: (id: string, data: UpdateBudgetData) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  fetchSummary: (filters?: BudgetFilters) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>()((set) => ({
  budgets: [],
  summary: [],
  loading: false,

  fetchBudgets: async (filters) => {
    set({ loading: true });
    try {
      const response = await budgetsApi.getAll(filters);
      set({ budgets: response.data.data });
    } finally {
      set({ loading: false });
    }
  },

  createBudget: async (data) => {
    const response = await budgetsApi.create(data);
    const newBudget = response.data.data;
    set((state) => ({ budgets: [...state.budgets, newBudget] }));
    return newBudget;
  },

  updateBudget: async (id, data) => {
    const response = await budgetsApi.update(id, data);
    const updated = response.data.data;
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? updated : b)),
    }));
    return updated;
  },

  deleteBudget: async (id) => {
    await budgetsApi.delete(id);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  fetchSummary: async (filters) => {
    set({ loading: true });
    try {
      const response = await budgetsApi.getSummary(filters);
      const raw = response.data.data as any;
      // Backend returns { budgets: [...], totalBudget, totalSpent, ... }
      const budgets = Array.isArray(raw) ? raw : raw?.budgets ?? [];
      const mapped: BudgetSummary[] = budgets.map((b: any) => ({
        id: b.id,
        name: b.name ?? 'Presupuesto mensual',
        categoryId: b.categoryId ?? b.category?.id ?? null,
        category: b.category ?? undefined,
        userId: '',
        amount: b.budgetAmount ?? b.amount ?? 0,
        spent: b.spentAmount ?? b.spent ?? 0,
        remaining: b.remainingAmount ?? b.remaining ?? 0,
        percentage: b.percentage ?? 0,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt ?? '',
        updatedAt: b.updatedAt ?? '',
      }));
      set({ summary: mapped });
    } finally {
      set({ loading: false });
    }
  },
}));
