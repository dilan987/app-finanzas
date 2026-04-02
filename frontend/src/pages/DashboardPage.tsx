import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBanknotes,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiChartPie,
  HiArrowRight,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import IncomeExpenseBarChart from '../components/charts/IncomeExpenseBarChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import BudgetProgressList from '../components/charts/BudgetProgressList';

import { analyticsApi } from '../api/analytics.api';
import { transactionsApi } from '../api/transactions.api';
import { budgetsApi } from '../api/budgets.api';
import { useUiStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate, getShortMonthName, formatMonthYear } from '../utils/formatDate';
import { PAYMENT_METHODS } from '../utils/constants';
import type {
  FinancialSummary,
  CategoryBreakdown,
  MonthlyTrend,
  BudgetSummary,
  Transaction,
} from '../types';

export default function DashboardPage() {
  const { currentMonth, currentYear } = useUiStore();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
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
  const barChartData = trends.map((t) => ({
    month: getShortMonthName(t.month),
    income: t.income,
    expense: t.expenses,
  }));

  const pieChartData = categoryBreakdown.map((c) => ({
    name: c.categoryName,
    value: c.total,
    color: c.categoryColor,
  }));

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  function getPaymentMethodLabel(value: string): string {
    return PAYMENT_METHODS.find((pm) => pm.value === value)?.label ?? value;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumen financiero de {formatMonthYear(currentMonth, currentYear)}
        </p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<HiBanknotes className="h-5 w-5" />}
          iconBgClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          label="Balance del mes"
          value={formatCurrency(summary?.balance ?? 0)}
          trend={
            summary && summary.balance !== 0
              ? { value: savingsRate, isPositive: summary.balance >= 0 }
              : undefined
          }
        />
        <StatCard
          icon={<HiArrowTrendingUp className="h-5 w-5" />}
          iconBgClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          label="Ingresos"
          value={formatCurrency(summary?.totalIncome ?? 0)}
        />
        <StatCard
          icon={<HiArrowTrendingDown className="h-5 w-5" />}
          iconBgClass="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
          label="Gastos"
          value={formatCurrency(summary?.totalExpenses ?? 0)}
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
        />
      </div>

      {/* Charts Row 1: Bar Chart + Pie Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card title="Ingresos vs Gastos" className="lg:col-span-3">
          {barChartData.length > 0 ? (
            <IncomeExpenseBarChart data={barChartData} height={320} />
          ) : (
            <EmptyState
              title="Sin datos"
              description="No hay datos de transacciones para mostrar el grafico."
            />
          )}
        </Card>

        <Card title="Gastos por Categoria" className="lg:col-span-2">
          {pieChartData.length > 0 ? (
            <CategoryPieChart data={pieChartData} height={320} />
          ) : (
            <EmptyState
              title="Sin gastos"
              description="No hay gastos registrados este mes."
            />
          )}
        </Card>
      </div>

      {/* Charts Row 2: Trend Line + Budget Progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        <Card title="Presupuestos Criticos">
          <BudgetProgressList budgets={topBudgets} />
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card
        title="Ultimas Transacciones"
        action={
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Ver todas
            <HiArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>
                  <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Categoria
                  </th>
                  <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Descripcion
                  </th>
                  <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">
                    Monto
                  </th>
                  <th className="hidden pb-3 text-left font-medium text-gray-500 dark:text-gray-400 sm:table-cell">
                    Metodo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="group">
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {formatShortDate(tx.date)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {tx.category && (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: tx.category.color }}
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">
                          {tx.category?.name ?? 'Sin categoria'}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate py-3 text-gray-700 dark:text-gray-300">
                      {tx.description}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-medium ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="hidden py-3 text-gray-500 dark:text-gray-400 sm:table-cell">
                      <Badge variant="info">{getPaymentMethodLabel(tx.paymentMethod)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
