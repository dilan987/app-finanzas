import { type ReactNode } from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'stat' | 'interactive';
  animate?: boolean;
  className?: string;
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  title,
  subtitle,
  action,
  padding = 'md',
  variant = 'default',
  animate = false,
  className = '',
}: CardProps) {
  const baseClasses = `rounded-xl border bg-surface-card ${paddingClasses[padding]}`;
  const borderClasses = 'border-border-primary';
  const shadowClasses = variant === 'interactive'
    ? 'shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-normal cursor-pointer'
    : 'shadow-card';

  const Wrapper = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
      }
    : {};

  return (
    <Wrapper
      className={`${baseClasses} ${borderClasses} ${shadowClasses} ${className}`}
      {...animationProps}
    >
      {(title || action) && (
        <div
          className={`flex items-start justify-between ${padding === 'none' ? 'px-6 pt-6' : 'mb-4'}`}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
            )}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Wrapper>
  );
}
