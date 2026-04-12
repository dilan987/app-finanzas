import { useState, useEffect } from 'react';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  thresholdColors?: boolean;
}

function getColorClass(value: number, threshold: boolean): string {
  if (!threshold) return 'bg-primary-500';
  if (value > 90) return 'bg-red-500 dark:bg-red-400';
  if (value > 70) return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-emerald-500 dark:bg-emerald-400';
}

const sizeClasses: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  showLabel = true,
  className = '',
  size = 'md',
  animated = true,
  thresholdColors = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const [displayWidth, setDisplayWidth] = useState(animated ? 0 : clamped);

  useEffect(() => {
    if (!animated) {
      setDisplayWidth(clamped);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplayWidth(clamped);
      return;
    }

    const timer = requestAnimationFrame(() => {
      setDisplayWidth(clamped);
    });
    return () => cancelAnimationFrame(timer);
  }, [clamped, animated]);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-end">
          <span className="text-xs font-semibold text-text-secondary">
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-surface-tertiary ${sizeClasses[size]}`}
      >
        <div
          className={`${sizeClasses[size]} rounded-full ${getColorClass(clamped, thresholdColors)} ${animated ? 'transition-all duration-[600ms] ease-out' : ''}`}
          style={{ width: `${displayWidth}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
