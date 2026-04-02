import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiBanknotes,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiChartPie,
  HiRocketLaunch,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import DatePicker from '../components/ui/DatePicker';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { investmentsApi } from '../api/investments.api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate } from '../utils/formatDate';
import { INVESTMENT_TYPES } from '../utils/constants';
import type {
  Investment,
  InvestmentSummary,
  InvestmentType,
  CreateInvestmentData,
  UpdateInvestmentData,
} from '../types';

const TYPE_COLORS: Record<InvestmentType, string> = {
  STOCKS: '#3b82f6',
  CDT: '#ec4899',
  CRYPTO: '#f59e0b',
  FUND: '#06b6d4',
  FOREX: '#6366f1',
  OTHER: '#78716c',
};

function getTypeLabel(type: InvestmentType): string {
  return INVESTMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

interface InvestmentFormState {
  name: string;
  type: InvestmentType;
  amountInvested: string;
  currentValue: string;
  startDate: string;
  notes: string;
}

const initialForm: InvestmentFormState = {
  name: '',
  type: 'STOCKS',
  amountInvested: '',
  currentValue: '',
  startDate: new Date().toISOString().split('T')[0] ?? '',
  notes: '',
};

function mapSummary(raw: any): InvestmentSummary | null {
  if (!raw) return null;
  return { ...raw, returnPercentage: raw.returnPercentage ?? raw.totalReturnPercentage ?? 0 };
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvestmentFormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [invRes, sumRes] = await Promise.all([
        investmentsApi.getAll(),
        investmentsApi.getSummary(),
      ]);
      setInvestments(invRes.data.data);
      setSummary(mapSummary(sumRes.data.data));
    } catch {
      toast.error('Error al cargar inversiones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setForm({
      name: inv.name,
      type: inv.type,
      amountInvested: String(inv.amountInvested),
      currentValue: String(inv.currentValue),
      startDate: inv.startDate?.split('T')[0] ?? '',
      notes: inv.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.amountInvested) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    const amount = parseFloat(form.amountInvested);
    const currentValue = form.currentValue ? parseFloat(form.currentValue) : undefined;
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto invertido debe ser mayor a 0');
      return;
    }
    if (currentValue !== undefined && (isNaN(currentValue) || currentValue < 0)) {
      toast.error('El valor actual debe ser valido');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const data: UpdateInvestmentData = {
          name: form.name,
          type: form.type,
          amountInvested: amount,
          currentValue,
          startDate: form.startDate,
          notes: form.notes || undefined,
        };
        const res = await investmentsApi.update(editingId, data);
        setInvestments((prev) => prev.map((i) => (i.id === editingId ? res.data.data : i)));
        toast.success('Inversión actualizada');
      } else {
        const data: CreateInvestmentData = {
          name: form.name,
          type: form.type,
          amountInvested: amount,
          currentValue,
          startDate: form.startDate,
          notes: form.notes || undefined,
        };
        const res = await investmentsApi.create(data);
        setInvestments((prev) => [...prev, res.data.data]);
        toast.success('Inversión creada');
      }
      setModalOpen(false);
      // Reload summary
      const sumRes = await investmentsApi.getSummary();
      setSummary(mapSummary(sumRes.data.data));
    } catch {
      toast.error('Error al guardar inversión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await investmentsApi.delete(deleteId);
      setInvestments((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success('Inversión eliminada');
      setDeleteId(null);
      const sumRes = await investmentsApi.getSummary();
      setSummary(mapSummary(sumRes.data.data));
    } catch {
      toast.error('Error al eliminar inversión');
    } finally {
      setDeleting(false);
    }
  };

  const pieData = (summary?.distribution ?? [])
    .filter((t) => t.totalCurrentValue > 0)
    .map((t) => ({
      name: getTypeLabel(t.type),
      value: t.totalCurrentValue,
      color: TYPE_COLORS[t.type] ?? '#78716c',
    }));

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inversiones</h1>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreate}>
          Nueva Inversión
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && investments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<HiBanknotes className="h-5 w-5" />}
            iconBgClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
            label="Total invertido"
            value={formatCurrency(summary.totalInvested)}
          />
          <StatCard
            icon={<HiChartPie className="h-5 w-5" />}
            iconBgClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
            label="Valor actual"
            value={formatCurrency(summary.totalCurrentValue)}
          />
          <StatCard
            icon={summary.totalReturn >= 0 ? <HiArrowTrendingUp className="h-5 w-5" /> : <HiArrowTrendingDown className="h-5 w-5" />}
            iconBgClass={summary.totalReturn >= 0
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
            }
            label="Rendimiento total"
            value={formatCurrency(summary.totalReturn)}
          />
          <StatCard
            icon={<HiArrowTrendingUp className="h-5 w-5" />}
            iconBgClass={summary.returnPercentage >= 0
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
            }
            label="Rendimiento %"
            value={`${(summary.returnPercentage ?? 0) >= 0 ? '+' : ''}${(summary.returnPercentage ?? 0).toFixed(2)}%`}
          />
        </div>
      )}

      {investments.length === 0 ? (
        <EmptyState
          icon={<HiBanknotes className="h-8 w-8" />}
          title="Sin inversiones"
          description="Registra tus inversiones para hacer seguimiento de tu portafolio."
          actionLabel="Agregar Inversión"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Investment List */}
          <div className="space-y-4 xl:col-span-2">
            {investments.map((inv) => {
              const returnAmount = inv.currentValue - inv.amountInvested;
              const returnPct = inv.amountInvested > 0 ? ((returnAmount / inv.amountInvested) * 100) : 0;
              const isPositive = returnAmount >= 0;
              return (
                <Card key={inv.id} padding="md">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{inv.name}</h3>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: TYPE_COLORS[inv.type] }}
                        >
                          {getTypeLabel(inv.type)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>Invertido: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(inv.amountInvested)}</span></span>
                        <span>Valor actual: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(inv.currentValue)}</span></span>
                        <span>Inicio: {formatShortDate(inv.startDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? '+' : ''}{formatCurrency(returnAmount)}
                        </p>
                        <p className={`text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(inv)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          aria-label="Editar"
                        >
                          <HiPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(inv.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          aria-label="Eliminar"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Distribution Chart */}
          <div className="space-y-4">
            {pieData.length > 0 && (
              <Card title="Distribución por tipo" padding="md">
                <CategoryPieChart data={pieData} height={300} centerLabel="Portafolio" />
              </Card>
            )}

            {/* Coming Soon Banner */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
              <HiRocketLaunch className="h-6 w-6 shrink-0 text-blue-500 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Próximamente: datos en tiempo real
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Sincronización automática de precios y rendimiento de mercado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Inversión' : 'Nueva Inversión'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Crear Inversión'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Acciones Apple, CDT Bancolombia..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Select
            label="Tipo de inversión"
            options={INVESTMENT_TYPES}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as InvestmentType }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monto invertido"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              value={form.amountInvested}
              onChange={(e) => setForm((f) => ({ ...f, amountInvested: e.target.value }))}
            />
            <Input
              label="Valor actual (opcional)"
              type="number"
              min="0"
              step="1000"
              placeholder="Igual al invertido"
              value={form.currentValue}
              onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))}
            />
          </div>
          <DatePicker
            label="Fecha de inicio"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas (opcional)
            </label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400"
              placeholder="Observaciones sobre esta inversión..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Inversión"
        message="¿Estás seguro de que deseas eliminar esta inversión? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
