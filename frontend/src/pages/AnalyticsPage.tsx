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
import Spinner from '../components/ui/Spinner';
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
      return { icon: <HiFire className="h-5 w-5" />, variant: 'critical', label: 'Crítico' };
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
      toast.error('Error al cargar análisis');
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
      toast.error('Error al marcar como leída');
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
      <div className="flex items-center justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Análisis Inteligente</h1>
      </div>

      {/* Financial Summary */}
      {summaryData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<HiArrowTrendingUp className="h-5 w-5" />}
            iconBgClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
            label="Ingresos del mes"
            value={formatCurrency(summaryData.totalIncome)}
          />
          <StatCard
            icon={<HiArrowTrendingDown className="h-5 w-5" />}
            iconBgClass="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
            label="Gastos del mes"
            value={formatCurrency(summaryData.totalExpenses)}
          />
          <StatCard
            icon={<HiScale className="h-5 w-5" />}
            iconBgClass={summaryData.balance >= 0
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
            }
            label="Balance"
            value={formatCurrency(summaryData.balance)}
          />
          <StatCard
            icon={<HiClipboardDocumentList className="h-5 w-5" />}
            iconBgClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
            label="Tasa de ahorro"
            value={`${(summaryData.savingsRate ?? 0).toFixed(1)}%`}
          />
        </div>
      )}

      {/* Category Breakdown & Trend Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card title="Desglose por categoría (gastos)" padding="md">
          {breakdown.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Sin datos para este mes
            </p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.categoryColor }}
                      />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatCurrency(cat.total)}
                      </span>
                      <span className="w-12 text-right text-xs font-medium text-gray-400 dark:text-gray-500">
                        {(cat.percentage ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
        <Card title="Tendencia (últimos 6 meses)" padding="md">
          {trendChartData.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recomendaciones</h2>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setRecFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  recFilter === 'all'
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setRecFilter('unread')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  recFilter === 'unread'
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                No leídas
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
                  className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                    rec.isRead
                      ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                      : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 ${
                    rec.severity === 'INFO' ? 'text-blue-500' :
                    rec.severity === 'WARNING' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{rec.message}</p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {new Date(rec.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  {!rec.isRead && (
                    <button
                      onClick={() => handleMarkRead(rec.id)}
                      disabled={markingReadId === rec.id}
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      aria-label="Marcar como leída"
                      title="Marcar como leída"
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
