import { type HTMLAttributes } from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
};

export default function Spinner({ size = 'md', className = '', ...rest }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
