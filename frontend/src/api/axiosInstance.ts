import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null): void {
  for (const item of failedQueue) {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token!);
    }
  }
  failedQueue = [];
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamic import avoided: read token from sessionStorage directly
    // to prevent circular dependency with authStore
    const raw = sessionStorage.getItem('auth-storage');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
        const token = parsed.state?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Ignore malformed storage
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't retry refresh or login requests
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<{ data: { accessToken: string } }>(
        `${import.meta.env.VITE_API_URL ?? '/api'}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newToken = response.data.data.accessToken;

      // Update sessionStorage
      const raw = sessionStorage.getItem('auth-storage');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { state: Record<string, unknown> };
          parsed.state.accessToken = newToken;
          sessionStorage.setItem('auth-storage', JSON.stringify(parsed));
        } catch {
          // Ignore
        }
      }

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Clear auth state
      sessionStorage.removeItem('auth-storage');

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
