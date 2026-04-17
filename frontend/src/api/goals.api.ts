import api from './axiosInstance';
import type {
  ApiResponse,
  PaginatedResponse,
  Goal,
  GoalProjection,
  GoalFilters,
  GoalMonthSummary,
  CreateGoalData,
  UpdateGoalData,
} from '../types';

export const goalsApi = {
  getAll(filters?: GoalFilters) {
    return api.get<PaginatedResponse<Goal>>('/goals', { params: filters });
  },

  getById(id: string) {
    return api.get<ApiResponse<Goal>>('/goals/' + id);
  },

  create(data: CreateGoalData) {
    return api.post<ApiResponse<Goal>>('/goals', data);
  },

  update(id: string, data: UpdateGoalData) {
    return api.put<ApiResponse<Goal>>('/goals/' + id, data);
  },

  cancel(id: string) {
    return api.patch<ApiResponse<Goal>>('/goals/' + id + '/cancel');
  },

  getProjection(id: string) {
    return api.get<ApiResponse<GoalProjection>>('/goals/' + id + '/projection');
  },

  getActiveForMonth(month: number, year: number) {
    return api.get<ApiResponse<GoalMonthSummary>>('/goals/active-for-month', {
      params: { month, year },
    });
  },

  linkTransaction(goalId: string, transactionId: string) {
    return api.post<ApiResponse<{ linked: boolean; goalCompleted: boolean }>>(
      '/goals/' + goalId + '/link',
      { transactionId },
    );
  },

  unlinkTransaction(goalId: string, transactionId: string) {
    return api.delete<ApiResponse<{ unlinked: boolean }>>(
      '/goals/' + goalId + '/unlink/' + transactionId,
    );
  },
};
