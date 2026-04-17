import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Lazy-loaded pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const BudgetsPage = lazy(() => import('../pages/BudgetsPage'));
const RecurringPage = lazy(() => import('../pages/RecurringPage'));
const InvestmentsPage = lazy(() => import('../pages/InvestmentsPage'));
const TransactionDetailPage = lazy(() => import('../pages/TransactionDetailPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const AccountsPage = lazy(() => import('../pages/AccountsPage'));
const GoalsPage = lazy(() => import('../pages/GoalsPage'));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/recurring" element={<RecurringPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
