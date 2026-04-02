import api from './axiosInstance';
import type {
  ApiResponse,
  Budget,
  BudgetSummary,
  BudgetFilters,
  CreateBudgetData,
  UpdateBudgetData,
} from '../types';

export const budgetsApi = {
  getAll(filters?: BudgetFilters) {
    return api.get<ApiResponse<Budget[]>>('/budgets', { params: filters });
  },

  getById(id: string) {
    return api.get<ApiResponse<Budget>>(`/budgets/${id}`);
  },

  create(data: CreateBudgetData) {
    return api.post<ApiResponse<Budget>>('/budgets', data);
  },

  update(id: string, data: UpdateBudgetData) {
    return api.put<ApiResponse<Budget>>(`/budgets/${id}`, data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/budgets/${id}`);
  },

  getSummary(filters?: BudgetFilters) {
    return api.get<ApiResponse<BudgetSummary[]>>('/budgets/summary', {
      params: filters,
    });
  },
};
