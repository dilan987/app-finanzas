import api from './axiosInstance';
import type {
  ApiResponse,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from '../types';

export const categoriesApi = {
  getAll() {
    return api.get<ApiResponse<Category[]>>('/categories');
  },

  getById(id: string) {
    return api.get<ApiResponse<Category>>(`/categories/${id}`);
  },

  create(data: CreateCategoryData) {
    return api.post<ApiResponse<Category>>('/categories', data);
  },

  update(id: string, data: UpdateCategoryData) {
    return api.put<ApiResponse<Category>>(`/categories/${id}`, data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/categories/${id}`);
  },
};
