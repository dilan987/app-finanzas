interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'chart';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

function getBaseClasses(variant: SkeletonProps['variant']): string {
  const base = 'animate-pulse bg-surface-tertiary';
  switch (variant) {
    case 'circular':
      return `${base} rounded-full`;
    case 'text':
      return `${base} rounded-md h-4`;
    case 'card':
      return `${base} rounded-xl`;
    case 'chart':
      return `${base} rounded-xl`;
    case 'rectangular':
    default:
      return `${base} rounded-lg`;
  }
}

export default function Skeleton({
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={getBaseClasses('text')}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width || '100%',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`${getBaseClasses('card')} p-6 ${className}`}
        style={{ height: height ? style.height : '120px', ...style }}
      >
        <div className="space-y-3">
          <div className="h-3 w-1/3 rounded-md bg-surface-secondary" />
          <div className="h-6 w-2/3 rounded-md bg-surface-secondary" />
          <div className="h-3 w-1/2 rounded-md bg-surface-secondary" />
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div
        className={`${getBaseClasses('chart')} ${className}`}
        style={{ height: height ? style.height : '200px', ...style }}
      />
    );
  }

  return (
    <div className={`${getBaseClasses(variant)} ${className}`} style={style} />
  );
}
