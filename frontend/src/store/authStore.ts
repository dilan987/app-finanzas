import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData, UpdateProfileData } from '../types';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (data: UpdateProfileData) => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const response = await authApi.login(credentials);
        const { user, accessToken } = response.data.data;
        set({ user, accessToken, isAuthenticated: true });
      },

      register: async (data) => {
        const response = await authApi.register(data);
        const { user, accessToken } = response.data.data;
        set({ user, accessToken, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Clear state even if the API call fails
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      refreshToken: async () => {
        const response = await authApi.refresh();
        const { accessToken } = response.data.data;
        set({ accessToken, isAuthenticated: true });
      },

      updateUser: async (data) => {
        const response = await usersApi.updateProfile(data);
        set({ user: response.data.data });
      },

      setUser: (user) => set({ user }),

      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
