import api from './axiosInstance';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
} from '../types';

export const authApi = {
  register(data: RegisterData) {
    return api.post<ApiResponse<AuthResponse>>('/auth/register', data);
  },

  login(data: LoginCredentials) {
    return api.post<ApiResponse<AuthResponse>>('/auth/login', data);
  },

  refresh() {
    return api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
  },

  logout() {
    return api.post<ApiResponse<null>>('/auth/logout');
  },

  forgotPassword(data: ForgotPasswordData) {
    return api.post<ApiResponse<null>>('/auth/forgot-password', data);
  },

  resetPassword(data: ResetPasswordData) {
    return api.post<ApiResponse<null>>('/auth/reset-password', data);
  },
};
