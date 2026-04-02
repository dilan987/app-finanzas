import { create } from 'zustand';
import type {
  Transaction,
  TransactionFilters,
  PaginationMeta,
  CreateTransactionData,
  UpdateTransactionData,
  MonthlyStats,
} from '../types';
import { transactionsApi } from '../api/transactions.api';

interface TransactionState {
  transactions: Transaction[];
  pagination: PaginationMeta | null;
  filters: TransactionFilters;
  loading: boolean;
  selectedTransaction: Transaction | null;
  monthlyStats: MonthlyStats | null;

  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<Transaction>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  setSelectedTransaction: (transaction: Transaction | null) => void;
  fetchMonthlyStats: (params?: { month?: number; year?: number }) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  pagination: null,
  filters: {},
  loading: false,
  selectedTransaction: null,
  monthlyStats: null,

  fetchTransactions: async (filters) => {
    set({ loading: true });
    try {
      const activeFilters = filters ?? get().filters;
      const response = await transactionsApi.getAll(activeFilters);
      set({
        transactions: response.data.data,
        pagination: response.data.pagination,
      });
    } finally {
      set({ loading: false });
    }
  },

  createTransaction: async (data) => {
    const response = await transactionsApi.create(data);
    const newTransaction = response.data.data;
    // Refetch to keep pagination consistent
    await get().fetchTransactions();
    return newTransaction;
  },

  updateTransaction: async (id, data) => {
    const response = await transactionsApi.update(id, data);
    const updated = response.data.data;
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
      selectedTransaction:
        state.selectedTransaction?.id === id ? updated : state.selectedTransaction,
    }));
    return updated;
  },

  deleteTransaction: async (id) => {
    await transactionsApi.delete(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      selectedTransaction:
        state.selectedTransaction?.id === id ? null : state.selectedTransaction,
    }));
  },

  setFilters: (filters) => {
    set({ filters });
  },

  setSelectedTransaction: (transaction) => {
    set({ selectedTransaction: transaction });
  },

  fetchMonthlyStats: async (params) => {
    const response = await transactionsApi.getMonthlyStats(params);
    set({ monthlyStats: response.data.data });
  },
}));
