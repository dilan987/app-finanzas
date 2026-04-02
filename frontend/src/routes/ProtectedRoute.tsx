import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import MainLayout from '../components/layout/MainLayout';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <MainLayout />;
}
