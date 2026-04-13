import { motion } from 'motion/react';
import { HiPencil, HiArchiveBox } from 'react-icons/hi2';
import { formatCurrency } from '../../utils/formatCurrency';
import { ACCOUNT_TYPES } from '../../utils/constants';
import type { Account } from '../../types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onArchive: (account: Account) => void;
  index?: number;
}

export default function AccountCard({ account, onEdit, onArchive, index = 0 }: AccountCardProps) {
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;
  const isNegativeBalance = account.currentBalance < 0;
  const isDebtType = account.type === 'CREDIT_CARD' || account.type === 'LOAN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group flex items-center justify-between rounded-xl border border-border-primary bg-surface-card p-4 shadow-card transition-all hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3.5">
        {/* Color indicator */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
          style={{ backgroundColor: account.color }}
        >
          {account.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{account.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">{typeLabel}</span>
            {account.institutionName && (
              <>
                <span className="text-xs text-text-tertiary">·</span>
                <span className="text-xs text-text-tertiary">{account.institutionName}</span>
              </>
            )}
            {!account.includeInBudget && (
              <span className="rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                Off-budget
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`text-lg font-bold tabular-nums ${
            isNegativeBalance
              ? 'text-red-600 dark:text-red-400'
              : isDebtType
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-text-primary'
          }`}
        >
          {formatCurrency(account.currentBalance)}
        </span>

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(account)}
            className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary"
            title="Editar"
          >
            <HiPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onArchive(account)}
            className="rounded-lg p-1.5 text-text-tertiary hover:bg-expense-bg hover:text-expense"
            title="Archivar"
          >
            <HiArchiveBox className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
