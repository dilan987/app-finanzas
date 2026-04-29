import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HiArrowDown, HiArrowUp, HiCalendar, HiArrowsRightLeft } from 'react-icons/hi2';
import Skeleton from '../ui/Skeleton';
import { cashflowApi } from '../../api/cashflow.api';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatCurrency';
import type {
  BiweeklyCashflowBucket,
  BiweeklyCashflowResponse,
} from '../../types';

interface BiweeklyTimelineProps {
  month: number;
  year: number;
}

function formatDay(iso: string): string {
  const datePart = iso.split('T')[0];
  if (datePart) {
    const day = datePart.split('-')[2];
    if (day) return day;
  }
  return new Date(iso).getUTCDate().toString().padStart(2, '0');
}

function isFutureMonth(month: number, year: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year > currentYear) return true;
  if (year === currentYear && month > currentMonth) return true;
  return false;
}

function BucketCard({ bucket }: { bucket: BiweeklyCashflowBucket }) {
  const title = `${bucket.half === 1 ? 'Primera quincena' : 'Segunda quincena'} (${bucket.rangeLabel})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border-primary bg-surface-card p-5 shadow-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiCalendar className="h-5 w-5 text-text-tertiary" />
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        </div>
        <span className="text-xs text-text-tertiary">
          {bucket.entries.length} {bucket.entries.length === 1 ? 'movimiento' : 'movimientos'}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-income-bg px-2 py-2 dark:bg-[rgba(5,150,105,0.12)]">
          <p className="text-[10px] uppercase tracking-wider text-income-dark dark:text-income-light">
            Ingresos
          </p>
          <p className="mt-1 text-sm font-semibold text-income dark:text-income-light">
            {formatCurrency(bucket.totalIncome)}
          </p>
        </div>
        <div className="rounded-lg bg-expense-bg px-2 py-2 dark:bg-[rgba(239,68,68,0.12)]">
          <p className="text-[10px] uppercase tracking-wider text-expense-dark dark:text-expense-light">
            Gastos
          </p>
          <p className="mt-1 text-sm font-semibold text-expense dark:text-expense-light">
            {formatCurrency(bucket.totalExpense)}
          </p>
        </div>
        <div
          className={`rounded-lg px-2 py-2 ${
            bucket.netBalance >= 0
              ? 'bg-income-bg dark:bg-[rgba(5,150,105,0.12)]'
              : 'bg-expense-bg dark:bg-[rgba(239,68,68,0.12)]'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Neto</p>
          <p
            className={`mt-1 text-sm font-semibold ${
              bucket.netBalance >= 0
                ? 'text-income dark:text-income-light'
                : 'text-expense dark:text-expense-light'
            }`}
          >
            {formatCurrency(bucket.netBalance)}
          </p>
        </div>
      </div>

      {bucket.entries.length === 0 ? (
        <p className="rounded-md bg-surface-secondary px-3 py-4 text-center text-xs text-text-tertiary dark:bg-surface-tertiary">
          Sin movimientos en esta quincena.
        </p>
      ) : (
        <ul className="space-y-2">
          {bucket.entries.map((e) => {
            const isTransfer = e.type === 'TRANSFER';
            const colorBg = e.category?.color ?? (isTransfer ? '#6366F1' : '#6B7280');
            return (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-lg border border-border-primary bg-surface-primary p-2.5"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: colorBg }}
                  aria-hidden="true"
                >
                  {e.type === 'INCOME' ? (
                    <HiArrowDown className="h-4 w-4" />
                  ) : isTransfer ? (
                    <HiArrowsRightLeft className="h-4 w-4" />
                  ) : (
                    <HiArrowUp className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {e.description || e.category?.name || 'Movimiento'}
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        e.type === 'INCOME'
                          ? 'text-income dark:text-income-light'
                          : isTransfer
                            ? 'text-text-secondary'
                            : 'text-expense dark:text-expense-light'
                      }`}
                    >
                      {isTransfer ? '' : e.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(e.amount)}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-text-tertiary">
                    <span>Día {formatDay(e.date)}</span>
                    {e.category ? (
                      <>
                        <span>·</span>
                        <span>{e.category.name}</span>
                      </>
                    ) : null}
                    {e.account ? (
                      <>
                        <span>·</span>
                        <span>{e.account.name}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

export default function BiweeklyTimeline({ month, year }: BiweeklyTimelineProps) {
  const [data, setData] = useState<BiweeklyCashflowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // F3: re-fetch when biweekly config changes in /settings.
  const customEnabled = useAuthStore((s) => s.user?.biweeklyCustomEnabled ?? false);
  const day1 = useAuthStore((s) => s.user?.biweeklyStartDay1 ?? null);
  const day2 = useAuthStore((s) => s.user?.biweeklyStartDay2 ?? null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    cashflowApi
      .getBiweekly({ month, year })
      .then((res) => {
        if (cancelled) return;
        setData(res.data.data);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo cargar el cash flow');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, year, customEnabled, day1, day2]);

  const allEmpty =
    !!data && data.buckets[0].entries.length === 0 && data.buckets[1].entries.length === 0;
  const showFutureHint = allEmpty && isFutureMonth(month, year);

  return (
    <section aria-label="Cash flow por quincena" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Cash flow por quincena</h2>
          <p className="text-sm text-text-secondary">
            Tus movimientos reales agrupados por quincena
          </p>
        </div>
        {data ? (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-text-tertiary">Neto del mes</p>
            <p
              className={`text-base font-semibold ${
                data.monthTotals.netBalance >= 0
                  ? 'text-income dark:text-income-light'
                  : 'text-expense dark:text-expense-light'
              }`}
            >
              {formatCurrency(data.monthTotals.netBalance)}
            </p>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton variant="card" height={220} />
          <Skeleton variant="card" height={220} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-expense/30 bg-expense-bg p-4 text-sm text-expense dark:border-expense-light/20 dark:bg-[rgba(239,68,68,0.06)] dark:text-expense-light">
          {error}
        </div>
      ) : data ? (
        <>
          {showFutureHint ? (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300">
              Las transacciones de este mes aún no se han registrado. Programa tus pagos en
              Movimientos programados o consulta la vista Mensual para la proyección.
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BucketCard bucket={data.buckets[0]} />
            <BucketCard bucket={data.buckets[1]} />
          </div>
        </>
      ) : null}
    </section>
  );
}
