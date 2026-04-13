import api from './axiosInstance';
import type {
  ApiResponse,
  Account,
  AccountSummary,
  AccountFilters,
  CreateAccountData,
  UpdateAccountData,
} from '../types';

export const accountsApi = {
  getAll(filters?: AccountFilters) {
    return api.get<ApiResponse<Account[]>>('/accounts', { params: filters });
  },

  getById(id: string) {
    return api.get<ApiResponse<Account>>(`/accounts/${id}`);
  },

  getSummary() {
    return api.get<ApiResponse<AccountSummary>>('/accounts/summary');
  },

  create(data: CreateAccountData) {
    return api.post<ApiResponse<Account>>('/accounts', data);
  },

  update(id: string, data: UpdateAccountData) {
    return api.put<ApiResponse<Account>>(`/accounts/${id}`, data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/accounts/${id}`);
  },

  reorder(accounts: Array<{ id: string; sortOrder: number }>) {
    return api.put<ApiResponse<null>>('/accounts/reorder', { accounts });
  },

  reconcile(id: string) {
    return api.post<ApiResponse<{ previousBalance: number; computedBalance: number; wasCorrect: boolean; account: Account }>>(`/accounts/${id}/reconcile`);
  },
};
