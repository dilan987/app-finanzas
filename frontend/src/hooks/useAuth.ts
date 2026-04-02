import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials, RegisterData } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        await storeLogin(credentials);
        toast.success('Inicio de sesion exitoso');
        navigate('/dashboard');
      } catch (error: unknown) {
        const message = extractErrorMessage(error, 'Error al iniciar sesion');
        toast.error(message);
        throw error;
      }
    },
    [storeLogin, navigate],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        await storeRegister(data);
        toast.success('Cuenta creada exitosamente');
        navigate('/dashboard');
      } catch (error: unknown) {
        const message = extractErrorMessage(error, 'Error al crear la cuenta');
        toast.error(message);
        throw error;
      }
    },
    [storeRegister, navigate],
  );

  const logout = useCallback(async () => {
    await storeLogout();
    toast.success('Sesion cerrada');
    navigate('/login');
  }, [storeLogout, navigate]);

  return { user, isAuthenticated, login, register, logout };
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const axiosError = error as {
      response?: { data?: { message?: string } };
    };
    if (typeof axiosError.response?.data?.message === 'string') {
      return axiosError.response.data.message;
    }
  }
  return fallback;
}
