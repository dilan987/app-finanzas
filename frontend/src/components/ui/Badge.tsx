import { type ReactNode } from 'react';

interface BadgeProps {
  variant?: 'income' | 'expense' | 'info' | 'warning' | 'critical';
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  income:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  expense:
    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  info:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  critical:
    'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
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
