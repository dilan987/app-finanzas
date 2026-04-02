import api from './axiosInstance';
import type {
  ApiResponse,
  PaginatedResponse,
  Transaction,
  TransactionFilters,
  CreateTransactionData,
  UpdateTransactionData,
  MonthlyStats,
} from '../types';

export const transactionsApi = {
  getAll(filters?: TransactionFilters) {
    return api.get<PaginatedResponse<Transaction>>('/transactions', {
      params: filters,
    });
  },

  getById(id: string) {
    return api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
  },

  create(data: CreateTransactionData) {
    return api.post<ApiResponse<Transaction>>('/transactions', data);
  },

  update(id: string, data: UpdateTransactionData) {
    return api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/transactions/${id}`);
  },

  getMonthlyStats(params?: { month?: number; year?: number }) {
    return api.get<ApiResponse<MonthlyStats>>('/transactions/stats/monthly', {
      params,
    });
  },
};
