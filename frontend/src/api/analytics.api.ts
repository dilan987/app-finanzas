import api from './axiosInstance';
import type {
  ApiResponse,
  FinancialSummary,
  CategoryBreakdown,
  MonthlyTrend,
  Recommendation,
} from '../types';

interface CategoryBreakdownParams {
  month?: number;
  year?: number;
  type?: string;
}

interface AnalyticsTrendParams {
  months?: number;
}

export const analyticsApi = {
  getSummary(params?: { month?: number; year?: number }) {
    return api.get<ApiResponse<FinancialSummary>>('/analytics/summary', { params });
  },

  getCategoryBreakdown(params?: CategoryBreakdownParams) {
    return api.get<ApiResponse<CategoryBreakdown[]>>('/analytics/category-breakdown', {
      params,
    });
  },

  getTrend(params?: AnalyticsTrendParams) {
    return api.get<ApiResponse<MonthlyTrend[]>>('/analytics/trend', { params });
  },

  generateRecommendations() {
    return api.post<ApiResponse<Recommendation[]>>('/analytics/generate-recommendations');
  },

  getRecommendations() {
    return api.get<ApiResponse<Recommendation[]>>('/analytics/recommendations');
  },

  markRecommendationAsRead(id: string) {
    return api.patch<ApiResponse<Recommendation>>(`/analytics/recommendations/${id}/read`);
  },
};
