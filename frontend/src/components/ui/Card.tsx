import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  title,
  subtitle,
  action,
  padding = 'md',
  className = '',
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${paddingClasses[padding]} ${className}`}
    >
      {(title || action) && (
        <div
          className={`flex items-start justify-between ${padding === 'none' ? 'px-5 pt-5' : 'mb-4'}`}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
