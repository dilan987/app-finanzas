import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiSparkles,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiScale,
  HiClipboardDocumentList,
  HiCheck,
  HiInformationCircle,
  HiExclamationTriangle,
  HiFire,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import TrendLineChart from '../components/charts/TrendLineChart';
import { analyticsApi } from '../api/analytics.api';
import { formatCurrency } from '../utils/formatCurrency';
import { getShortMonthName } from '../utils/formatDate';
import { useUiStore } from '../store/uiStore';
import type {
  FinancialSummary,
  CategoryBreakdown,
  MonthlyTrend,
  Recommendation,
  Severity,
} from '../types';

function getSeverityConfig(severity: Severity): { icon: React.ReactNode; variant: 'info' | 'warning' | 'critical'; label: string } {
  switch (severity) {
    case 'INFO':
      return { icon: <HiInformationCircle className="h-5 w-5" />, variant: 'info', label: 'Info' };
    case 'WARNING':
      return { icon: <HiExclamationTriangle className="h-5 w-5" />, variant: 'warning', label: 'Advertencia' };
    case 'CRITICAL':
      return { icon: <HiFire className="h-5 w-5" />, variant: 'critical', label: 'Critico' };
  }
}

function getSeverityBorderClass(severity: Severity, isRead: boolean): string {
  if (isRead) return 'border-border-primary bg-surface-card';
  switch (severity) {
    case 'INFO':
      return 'border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-950/20';
    case 'WARNING':
      return 'border-warning-dark/20 bg-warning-bg/50 dark:border-warning-light/20 dark:bg-[rgba(245,158,11,0.06)]';
    case 'CRITICAL':
      return 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20';
  }
}

function getSeverityIconClass(severity: Severity): string {
  switch (severity) {
    case 'INFO':
      return 'text-primary-500 dark:text-primary-400';
    case 'WARNING':
      return 'text-warning-dark dark:text-warning-light';
    case 'CRITICAL':
      return 'text-expense dark:text-expense-light';
  }
}

type RecommendationFilter = 'all' | 'unread';

export default function AnalyticsPage() {
  const { currentMonth, currentYear } = useUiStore();
  const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [recFilter, setRecFilter] = useState<RecommendationFilter>('all');

  const loadData = useCallback(async () => {
    try {
      const [sumRes, bdRes, trendRes, recRes] = await Promise.all([
        analyticsApi.getSummary({ month: currentMonth, year: currentYear }),
        analyticsApi.getCategoryBreakdown({ month: currentMonth, year: currentYear, type: 'EXPENSE' }),
        analyticsApi.getTrend({ months: 6 }),
        analyticsApi.getRecommendations(),
      ]);
      setSummaryData(sumRes.data.data);
      setBreakdown((bdRes.data.data ?? []).map((item: any) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        categoryColor: item.categoryColor ?? '#6B7280',
        categoryIcon: item.categoryIcon ?? 'tag',
        total: item.total ?? item.totalSpent ?? 0,
        percentage: item.percentage ?? 0,
        previousTotal: item.previousTotal ?? item.previousMonthTotal ?? 0,
        change: item.change ?? item.changePercentage ?? 0,
      })));
      setTrend((trendRes.data.data ?? []).map((item: any) => ({
        month: item.month,
        year: item.year,
        income: item.income ?? item.totalIncome ?? 0,
        expenses: item.expenses ?? item.totalExpenses ?? 0,
        savingsRate: item.savingsRate ?? 0,
      })));
      setRecommendations(recRes.data.data ?? []);
    } catch {
      toast.error('Error al cargar analisis');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await analyticsApi.generateRecommendations();
      const recRes = await analyticsApi.getRecommendations();
      setRecommendations(recRes.data.data);
      toast.success('Recomendaciones generadas');
    } catch {
      toast.error('Error al generar recomendaciones');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setMarkingReadId(id);
    try {
      const res = await analyticsApi.markRecommendationAsRead(id);
      setRecommendations((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
    } catch {
      toast.error('Error al marcar como leida');
    } finally {
      setMarkingReadId(null);
    }
  };

  const trendChartData = trend.map((t) => ({
    month: `${getShortMonthName(t.month)} ${t.year}`,
    income: t.income,
    expense: t.expenses,
    savings: t.savingsRate,
  }));

  const filteredRecommendations = recFilter === 'unread'
    ? recommendations.filter((r) => !r.isRead)
    : recommendations;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton variant="text" width="240px" height="32px" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" height="120px" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton variant="chart" height="350px" />
          <Skeleton variant="chart" height="350px" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Analisis Inteligente</h1>
      </div>

      {/* Financial Summary */}
      {summaryData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<HiArrowTrendingUp className="h-5 w-5" />}
            iconBgClass="bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light"
            label="Ingresos del mes"
            value={formatCurrency(summaryData.totalIncome)}
            index={0}
          />
          <StatCard
            icon={<HiArrowTrendingDown className="h-5 w-5" />}
            iconBgClass="bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light"
            label="Gastos del mes"
            value={formatCurrency(summaryData.totalExpenses)}
            index={1}
          />
          <StatCard
            icon={<HiScale className="h-5 w-5" />}
            iconBgClass={summaryData.balance >= 0
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
              : 'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
            }
            label="Balance"
            value={formatCurrency(summaryData.balance)}
            index={2}
          />
          <StatCard
            icon={<HiClipboardDocumentList className="h-5 w-5" />}
            iconBgClass="bg-invest-bg text-invest dark:bg-[rgba(139,92,246,0.12)] dark:text-invest-light"
            label="Tasa de ahorro"
            value={`${(summaryData.savingsRate ?? 0).toFixed(1)}%`}
            index={3}
          />
        </div>
      )}

      {/* Category Breakdown & Trend Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card title="Desglose por categoria (gastos)" padding="md">
          {breakdown.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-secondary">
              Sin datos para este mes
            </p>
          ) : (
            <div className="space-y-4">
              {breakdown.map((cat) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.categoryColor }}
                      />
                      <span className="font-medium text-text-primary">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-text-secondary">
                        {formatCurrency(cat.total)}
                      </span>
                      <span className="w-12 text-right text-xs font-semibold text-text-tertiary">
                        {(cat.percentage ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.categoryColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Trend Chart */}
        <Card title="Tendencia (ultimos 6 meses)" padding="md">
          {trendChartData.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-secondary">
              Sin datos de tendencia
            </p>
          ) : (
            <TrendLineChart data={trendChartData} height={300} />
          )}
        </Card>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Recomendaciones</h2>
          <div className="flex items-center gap-3">
            <div className="flex overflow-hidden rounded-lg border border-border-primary">
              <button
                onClick={() => setRecFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  recFilter === 'all'
                    ? 'bg-surface-tertiary text-text-primary'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setRecFilter('unread')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  recFilter === 'unread'
                    ? 'bg-surface-tertiary text-text-primary'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                No leidas
              </button>
            </div>
            <Button
              icon={<HiSparkles className="h-4 w-4" />}
              onClick={handleGenerate}
              loading={generating}
            >
              Generar Recomendaciones
            </Button>
          </div>
        </div>

        {filteredRecommendations.length === 0 ? (
          <EmptyState
            icon={<HiSparkles className="h-8 w-8" />}
            title="Sin recomendaciones"
            description="Genera recomendaciones basadas en tu actividad financiera."
            actionLabel="Generar Recomendaciones"
            onAction={handleGenerate}
          />
        ) : (
          <div className="space-y-3">
            {filteredRecommendations.map((rec) => {
              const config = getSeverityConfig(rec.severity);
              return (
                <div
                  key={rec.id}
                  className={`flex items-start gap-4 rounded-xl border p-4 shadow-card transition-colors ${getSeverityBorderClass(rec.severity, rec.isRead)}`}
                >
                  <div className={`mt-0.5 shrink-0 ${getSeverityIconClass(rec.severity)}`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{rec.message}</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {new Date(rec.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  {!rec.isRead && (
                    <button
                      onClick={() => handleMarkRead(rec.id)}
                      disabled={markingReadId === rec.id}
                      className="shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-50 transition-colors"
                      aria-label="Marcar como leida"
                      title="Marcar como leida"
                    >
                      <HiCheck className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
