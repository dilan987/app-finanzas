import { type ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-tertiary text-text-tertiary">
          <span className="text-3xl">{icon}</span>
        </div>
      )}
      <h3 className="mb-1.5 text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
