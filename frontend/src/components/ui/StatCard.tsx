import { type ReactNode } from 'react';
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
}

export default function StatCard({
  icon,
  iconBgClass = 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  label,
  value,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBgClass}`}>
          {icon}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.isPositive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
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
      <div className="mt-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}
