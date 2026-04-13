import { create } from 'zustand';
import type {
  Account,
  AccountSummary,
  CreateAccountData,
  UpdateAccountData,
} from '../types';
import { accountsApi } from '../api/accounts.api';

interface AccountState {
  accounts: Account[];
  summary: AccountSummary | null;
  loading: boolean;

  fetchAccounts: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  createAccount: (data: CreateAccountData) => Promise<Account>;
  updateAccount: (id: string, data: UpdateAccountData) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: [],
  summary: null,
  loading: false,

  fetchAccounts: async () => {
    set({ loading: true });
    try {
      const response = await accountsApi.getAll({ isActive: true });
      set({ accounts: response.data.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchSummary: async () => {
    set({ loading: true });
    try {
      const response = await accountsApi.getSummary();
      set({ summary: response.data.data });
    } finally {
      set({ loading: false });
    }
  },

  createAccount: async (data) => {
    const response = await accountsApi.create(data);
    const newAccount = response.data.data;
    await get().fetchAccounts();
    await get().fetchSummary();
    return newAccount;
  },

  updateAccount: async (id, data) => {
    const response = await accountsApi.update(id, data);
    const updated = response.data.data;
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
    }));
    await get().fetchSummary();
    return updated;
  },

  deleteAccount: async (id) => {
    await accountsApi.delete(id);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
    await get().fetchSummary();
  },
}));
