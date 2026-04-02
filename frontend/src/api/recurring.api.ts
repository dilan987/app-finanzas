import api from './axiosInstance';
import type {
  ApiResponse,
  RecurringTransaction,
  RecurringFilters,
  CreateRecurringData,
  UpdateRecurringData,
} from '../types';

export const recurringApi = {
  getAll(filters?: RecurringFilters) {
    return api.get<ApiResponse<RecurringTransaction[]>>('/recurring', {
      params: filters,
    });
  },

  getById(id: string) {
    return api.get<ApiResponse<RecurringTransaction>>(`/recurring/${id}`);
  },

  create(data: CreateRecurringData) {
    return api.post<ApiResponse<RecurringTransaction>>('/recurring', data);
  },

  update(id: string, data: UpdateRecurringData) {
    return api.put<ApiResponse<RecurringTransaction>>(`/recurring/${id}`, data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/recurring/${id}`);
  },

  toggle(id: string) {
    return api.patch<ApiResponse<RecurringTransaction>>(`/recurring/${id}/toggle`);
  },

  process() {
    return api.post<ApiResponse<{ processed: number }>>('/recurring/process');
  },
};
