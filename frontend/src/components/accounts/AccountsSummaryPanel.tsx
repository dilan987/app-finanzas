import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { HiArrowRight, HiBuildingLibrary } from 'react-icons/hi2';
import { useAccountStore } from '../../store/accountStore';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../ui/Spinner';
import type { Account } from '../../types';

function AccountRow({ account }: { account: Account }) {
  const isDebt = account.type === 'CREDIT_CARD' || account.type === 'LOAN';
  const isNegative = account.currentBalance < 0;

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: account.color }}
        />
        <span className="truncate text-sm text-text-secondary">{account.name}</span>
      </div>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isNegative
            ? 'text-red-600 dark:text-red-400'
            : isDebt
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-text-primary'
        }`}
      >
        {formatCurrency(account.currentBalance)}
      </span>
    </div>
  );
}

export default function AccountsSummaryPanel() {
  const { summary, fetchSummary, loading } = useAccountStore();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading && !summary) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (!summary || summary.accounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-dashed border-border-primary bg-surface-card p-6 text-center"
      >
        <HiBuildingLibrary className="mx-auto h-8 w-8 text-text-tertiary" />
        <p className="mt-2 text-sm font-medium text-text-secondary">
          No tienes cuentas configuradas
        </p>
        <Link
          to="/accounts"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Configurar cuentas
          <HiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border-primary bg-surface-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Mis Cuentas</h3>
          <p className="text-2xl font-bold tracking-tight text-text-primary mt-0.5">
            {formatCurrency(summary.netWorth)}
          </p>
          <p className="text-xs text-text-tertiary">Patrimonio neto</p>
        </div>
        <Link
          to="/accounts"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Ver todas
          <HiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* On-budget accounts */}
      {summary.onBudget.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Presupuesto
            </span>
            <span className="text-xs font-medium text-text-secondary">
              {formatCurrency(summary.onBudgetTotal)}
            </span>
          </div>
          <div className="space-y-0.5">
            {summary.onBudget.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
          </div>
        </div>
      )}

      {/* Off-budget accounts */}
      {summary.offBudget.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Seguimiento
            </span>
            <span className="text-xs font-medium text-text-secondary">
              {formatCurrency(summary.offBudgetTotal)}
            </span>
          </div>
          <div className="space-y-0.5">
            {summary.offBudget.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
