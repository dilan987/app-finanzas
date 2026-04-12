import { type ReactNode } from 'react';

interface BadgeProps {
  variant?: 'income' | 'expense' | 'info' | 'warning' | 'critical' | 'invest' | 'neutral';
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  income:
    'bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light',
  expense:
    'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light',
  info:
    'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400',
  warning:
    'bg-warning-bg text-warning-dark dark:bg-[rgba(245,158,11,0.12)] dark:text-warning-light',
  critical:
    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  invest:
    'bg-invest-bg text-invest dark:bg-[rgba(139,92,246,0.12)] dark:text-invest-light',
  neutral:
    'bg-surface-tertiary text-text-secondary',
};

export default function Badge({ variant = 'info', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
