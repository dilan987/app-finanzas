import api from './axiosInstance';
import type {
  ApiResponse,
  Investment,
  InvestmentSummary,
  CreateInvestmentData,
  UpdateInvestmentData,
} from '../types';

export const investmentsApi = {
  getAll() {
    return api.get<ApiResponse<Investment[]>>('/investments');
  },

  getById(id: string) {
    return api.get<ApiResponse<Investment>>(`/investments/${id}`);
  },

  create(data: CreateInvestmentData) {
    return api.post<ApiResponse<Investment>>('/investments', data);
  },

  update(id: string, data: UpdateInvestmentData) {
    return api.put<ApiResponse<Investment>>(`/investments/${id}`, data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/investments/${id}`);
  },

  getSummary() {
    return api.get<ApiResponse<InvestmentSummary>>('/investments/summary');
  },
};
