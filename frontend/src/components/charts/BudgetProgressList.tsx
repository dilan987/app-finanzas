import ProgressBar from '../ui/ProgressBar';

interface BudgetProgressItem {
  categoryName: string;
  categoryColor: string;
  spent: number;
  total: number;
  percentage: number;
}

interface BudgetProgressListProps {
  budgets: BudgetProgressItem[];
  className?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BudgetProgressList({ budgets, className = '' }: BudgetProgressListProps) {
  if (budgets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay presupuestos configurados.
      </p>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {budgets.map((budget) => (
        <div key={budget.categoryName}>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: budget.categoryColor }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {budget.categoryName}
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(budget.spent)}{' '}
              <span className="text-gray-400 dark:text-gray-500">/ {formatCurrency(budget.total)}</span>
            </span>
          </div>
          <ProgressBar value={budget.percentage} showLabel={false} size="sm" />
        </div>
      ))}
    </div>
  );
}
