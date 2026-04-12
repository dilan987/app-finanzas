import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { HiArrowTrendingUp, HiArrowTrendingDown } from 'react-icons/hi2';

interface StatCardProps {
  icon: ReactNode;
  iconBgClass?: string;
  label: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  index?: number;
}

export default function StatCard({
  icon,
  iconBgClass = 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400',
  label,
  value,
  trend,
  className = '',
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0, 0, 0.2, 1] }}
      className={`rounded-xl border border-border-primary bg-surface-card p-5 shadow-card ${className}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.isPositive
                ? 'bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light'
                : 'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
            }`}
          >
            {trend.isPositive ? (
              <HiArrowTrendingUp className="h-3.5 w-3.5" />
            ) : (
              <HiArrowTrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
          {value}
        </p>
      </div>
    </motion.div>
  );
}
