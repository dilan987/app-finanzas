interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getColorClass(value: number): string {
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
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-end">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${sizeClasses[size]}`}
      >
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${getColorClass(clamped)}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
