import api from './axiosInstance';
import type {
  ApiResponse,
  User,
  UpdateProfileData,
  ChangePasswordData,
} from '../types';

export const usersApi = {
  getProfile() {
    return api.get<ApiResponse<User>>('/users/profile');
  },

  updateProfile(data: UpdateProfileData) {
    return api.put<ApiResponse<User>>('/users/profile', data);
  },

  changePassword(data: ChangePasswordData) {
    return api.put<ApiResponse<null>>('/users/change-password', data);
  },

  deleteAccount() {
    return api.delete<ApiResponse<null>>('/users/account');
  },
};
