import api from './axiosInstance';
import type { ApiResponse, BiweeklyCashflowResponse } from '../types';

export const cashflowApi = {
  getBiweekly(params: { month: number; year: number }) {
    return api.get<ApiResponse<BiweeklyCashflowResponse>>('/cashflow/biweekly', { params });
  },
};
