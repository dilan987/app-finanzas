import { motion } from 'motion/react';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';

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

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

export default function BudgetProgressList({ budgets, className = '' }: BudgetProgressListProps) {
  if (budgets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        No hay presupuestos configurados.
      </p>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {budgets.map((budget, index) => (
        <motion.div
          key={budget.categoryName}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: budget.categoryColor }}
              />
              <span className="text-sm font-medium text-text-primary">
                {budget.categoryName}
              </span>
            </div>
            <span className="text-sm tabular-nums text-text-secondary">
              {formatCurrency(budget.spent)}{' '}
              <span className="text-text-tertiary">
                / {formatCurrency(budget.total)}
              </span>
            </span>
          </div>
          <ProgressBar
            value={budget.percentage}
            showLabel={false}
            size="sm"
            animated
            thresholdColors
          />
        </motion.div>
      ))}
    </div>
  );
}
