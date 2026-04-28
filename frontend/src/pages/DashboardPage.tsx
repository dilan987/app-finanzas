import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiChartPie,
  HiArrowRight,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import MonthSelector from '../components/ui/MonthSelector';
import TrendLineChart from '../components/charts/TrendLineChart';
import BudgetProgressList from '../components/charts/BudgetProgressList';

import { analyticsApi } from '../api/analytics.api';
import { transactionsApi } from '../api/transactions.api';
import { budgetsApi } from '../api/budgets.api';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate, getShortMonthName } from '../utils/formatDate';
import { PAYMENT_METHODS } from '../utils/constants';
import type {
  FinancialSummary,
  CategoryBreakdown,
  MonthlyTrend,
  BudgetSummary,
  Transaction,
} from '../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardPage() {
  const { currentMonth, currentYear } = useUiStore();
  const user = useAuthStore((s) => s.user);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, breakdownRes, trendRes, budgetRes, txRes] = await Promise.all([
        analyticsApi.getSummary({ month: currentMonth, year: currentYear }),
        analyticsApi.getCategoryBreakdown({ month: currentMonth, year: currentYear, type: 'EXPENSE' }),
        analyticsApi.getTrend({ months: 6 }),
        budgetsApi.getSummary({ month: currentMonth, year: currentYear }),
        transactionsApi.getAll({ page: 1, limit: 5, startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01` }),
      ]);

      setSummary(summaryRes.data.data);
      setCategoryBreakdown((Array.isArray(breakdownRes.data.data) ? breakdownRes.data.data : []).map((item: any) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        categoryColor: item.categoryColor ?? '#6B7280',
        categoryIcon: item.categoryIcon ?? 'tag',
        total: item.total ?? item.totalSpent ?? 0,
        percentage: item.percentage ?? 0,
        previousTotal: item.previousTotal ?? item.previousMonthTotal ?? 0,
        change: item.change ?? item.changePercentage ?? 0,
      })));
      setTrends((Array.isArray(trendRes.data.data) ? trendRes.data.data : []).map((item: any) => ({
        month: item.month,
        year: item.year,
        income: item.income ?? item.totalIncome ?? 0,
        expenses: item.expenses ?? item.totalExpenses ?? 0,
        savingsRate: item.savingsRate ?? 0,
      })));
      // Budget summary returns { budgets: [...], totalBudget, ... }
      const budgetData = budgetRes.data.data as any;
      const budgetItems = Array.isArray(budgetData) ? budgetData : budgetData?.budgets ?? [];
      setBudgets(budgetItems.map((b: any) => ({
        id: b.id,
        name: b.name ?? '',
        categoryId: b.categoryId ?? null,
        category: b.category,
        userId: '',
        amount: b.budgetAmount ?? b.amount ?? 0,
        spent: b.spentAmount ?? b.spent ?? 0,
        remaining: b.remainingAmount ?? b.remaining ?? 0,
        percentage: b.percentage ?? 0,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt ?? '',
        updatedAt: b.updatedAt ?? '',
      })));
      setRecentTransactions(txRes.data.data);
    } catch {
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived data for charts
  const trendLineData = trends.map((t) => ({
    month: getShortMonthName(t.month),
    income: t.income,
    expense: t.expenses,
    savings: t.savingsRate,
  }));

  const topBudgets = [...budgets]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
    .map((b) => ({
      categoryName: b.name || b.category?.name || 'Presupuesto',
      categoryColor: b.category?.color ?? '#6366f1',
      spent: b.spent,
      total: b.amount,
      percentage: b.percentage,
    }));

  const savingsRate =
    summary && summary.totalIncome > 0
      ? ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100
      : 0;

  function getPaymentMethodLabel(value: string): string {
    return PAYMENT_METHODS.find((pm) => pm.value === value)?.label ?? value;
  }

  return (
    <div className="space-y-6" data-tour="dashboard-summary">
      {/* ── Header: Greeting + Month Selector ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {getGreeting()}{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Aqui esta tu resumen financiero del mes
          </p>
        </div>
        <MonthSelector />
      </div>

      {/* ── Large Balance Card with AnimatedNumber ── */}
      {loading ? (
        <Skeleton variant="card" height={140} />
      ) : (
        <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
          <p className="text-sm font-medium text-text-secondary">Balance total del mes</p>
          <div className="mt-2 flex items-baseline gap-3">
            <AnimatedNumber
              value={summary?.balance ?? 0}
              formatFn={(n) => formatCurrency(n)}
              className={`text-4xl font-bold tracking-tight ${
                (summary?.balance ?? 0) >= 0
                  ? 'text-income dark:text-income-light'
                  : 'text-expense dark:text-expense-light'
              }`}
            />
            {savingsRate !== 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  savingsRate > 0
                    ? 'bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light'
                    : 'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
                }`}
              >
                {savingsRate > 0 ? (
                  <HiArrowTrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <HiArrowTrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(savingsRate).toFixed(1)}% ahorro
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-text-tertiary">
            Ingresos menos gastos de este periodo
          </p>
        </div>
      )}

      {/* ── Stat Cards Row ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" height={120} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={<HiArrowTrendingUp className="h-5 w-5" />}
            iconBgClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
            label="Ingresos"
            value={formatCurrency(summary?.totalIncome ?? 0)}
            trend={
              summary?.incomeChange !== undefined && summary.incomeChange !== 0
                ? { value: summary.incomeChange, isPositive: summary.incomeChange > 0 }
                : undefined
            }
            index={0}
          />
          <StatCard
            icon={<HiArrowTrendingDown className="h-5 w-5" />}
            iconBgClass="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
            label="Gastos"
            value={formatCurrency(summary?.totalExpenses ?? 0)}
            trend={
              summary?.expenseChange !== undefined && summary.expenseChange !== 0
                ? { value: summary.expenseChange, isPositive: summary.expenseChange < 0 }
                : undefined
            }
            index={1}
          />
          <StatCard
            icon={<HiChartPie className="h-5 w-5" />}
            iconBgClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
            label="Tasa de Ahorro"
            value={`${savingsRate.toFixed(1)}%`}
            trend={
              savingsRate !== 0
                ? { value: savingsRate, isPositive: savingsRate > 0 }
                : undefined
            }
            index={2}
          />
        </div>
      )}

      {/* ── Trend Line Chart (area chart with gradient) ── */}
      {loading ? (
        <Skeleton variant="chart" height={400} />
      ) : (
        <Card title="Tendencia (6 meses)">
          {trendLineData.length > 0 ? (
            <TrendLineChart data={trendLineData} height={320} />
          ) : (
            <EmptyState
              title="Sin tendencia"
              description="Necesitas al menos un mes de datos para ver la tendencia."
            />
          )}
        </Card>
      )}

      {/* ── Recent Transactions + Budget Progress ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Transactions */}
        <div className="lg:col-span-3">
          {loading ? (
            <Skeleton variant="chart" height={400} />
          ) : (
            <Card
              title="Ultimas Transacciones"
              action={
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Ver todas
                  <HiArrowRight className="h-4 w-4" />
                </Link>
              }
            >
              {recentTransactions.length > 0 ? (
                <div className="space-y-1">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-surface-tertiary"
                    >
                      {/* Left side: category dot + info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: tx.category?.color
                              ? `${tx.category.color}20`
                              : 'rgba(107,114,128,0.1)',
                          }}
                        >
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: tx.category?.color ?? '#6B7280' }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {tx.description || tx.category?.name || 'Sin descripcion'}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {formatShortDate(tx.date)}
                            <span className="mx-1.5">·</span>
                            {tx.category?.name ?? 'Sin categoria'}
                          </p>
                        </div>
                      </div>

                      {/* Right side: amount + badge */}
                      <div className="flex items-center gap-3 shrink-0 pl-3">
                        <span
                          className={`text-sm font-semibold ${
                            tx.type === 'INCOME'
                              ? 'text-income dark:text-income-light'
                              : 'text-expense dark:text-expense-light'
                          }`}
                        >
                          {tx.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                        <Badge variant="info" className="hidden sm:inline-flex">
                          {getPaymentMethodLabel(tx.paymentMethod)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Sin transacciones"
                  description="No hay transacciones registradas este mes."
                  actionLabel="Agregar transaccion"
                  onAction={() => {
                    window.location.href = '/transactions';
                  }}
                />
              )}
            </Card>
          )}
        </div>

        {/* Budget Progress */}
        <div className="lg:col-span-2">
          {loading ? (
            <Skeleton variant="chart" height={400} />
          ) : (
            <Card title="Presupuestos">
              <BudgetProgressList budgets={topBudgets} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
