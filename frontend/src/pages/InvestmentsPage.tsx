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
import CurrencyInput from '../components/ui/CurrencyInput';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import DatePicker from '../components/ui/DatePicker';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { investmentsApi } from '../api/investments.api';
import { useFormModal } from '../hooks/useFormModal';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
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

function getTypeBadgeVariant(type: InvestmentType): 'info' | 'invest' | 'warning' | 'expense' | 'neutral' {
  switch (type) {
    case 'STOCKS': return 'info';
    case 'CDT': return 'expense';
    case 'CRYPTO': return 'warning';
    case 'FUND': return 'info';
    case 'FOREX': return 'invest';
    case 'OTHER': return 'neutral';
    default: return 'neutral';
  }
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

  const modal = useFormModal<InvestmentFormState>(initialForm);

  const reloadSummary = useCallback(async () => {
    const sumRes = await investmentsApi.getSummary();
    setSummary(mapSummary(sumRes.data.data));
  }, []);

  const deleteConfirm = useDeleteConfirm(
    async (id) => {
      await investmentsApi.delete(id);
      setInvestments((prev) => prev.filter((i) => i.id !== id));
      await reloadSummary();
    },
    { successMessage: 'Inversion eliminada', errorMessage: 'Error al eliminar inversion' },
  );

  const loadData = useCallback(async () => {
    try {
      const [invRes, sumRes] = await Promise.all([investmentsApi.getAll(), investmentsApi.getSummary()]);
      setInvestments(invRes.data.data);
      setSummary(mapSummary(sumRes.data.data));
    } catch {
      toast.error('Error al cargar inversiones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (inv: Investment) => {
    modal.openEdit(inv.id, {
      name: inv.name,
      type: inv.type,
      amountInvested: String(inv.amountInvested),
      currentValue: String(inv.currentValue),
      startDate: inv.startDate?.split('T')[0] ?? '',
      notes: inv.notes ?? '',
    });
  };

  const handleSubmit = async () => {
    if (!modal.form.name || !modal.form.amountInvested) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    const amount = parseFloat(modal.form.amountInvested);
    const currentValue = modal.form.currentValue ? parseFloat(modal.form.currentValue) : undefined;
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto invertido debe ser mayor a 0');
      return;
    }
    if (currentValue !== undefined && (isNaN(currentValue) || currentValue < 0)) {
      toast.error('El valor actual debe ser valido');
      return;
    }
    modal.setSaving(true);
    try {
      const payload = {
        name: modal.form.name,
        type: modal.form.type,
        amountInvested: amount,
        currentValue,
        startDate: modal.form.startDate,
        notes: modal.form.notes || undefined,
      };
      if (modal.editingId) {
        const res = await investmentsApi.update(modal.editingId, payload as UpdateInvestmentData);
        setInvestments((prev) => prev.map((i) => (i.id === modal.editingId ? res.data.data : i)));
        toast.success('Inversion actualizada');
      } else {
        const res = await investmentsApi.create(payload as CreateInvestmentData);
        setInvestments((prev) => [...prev, res.data.data]);
        toast.success('Inversion creada');
      }
      modal.close();
      await reloadSummary();
    } catch {
      toast.error('Error al guardar inversion');
    } finally {
      modal.setSaving(false);
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
    <div className="space-y-6 p-6" data-tour="investments-list">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Inversiones</h1>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={modal.openCreate}>Nueva Inversion</Button>
      </div>

      {summary && investments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<HiBanknotes className="h-5 w-5" />} iconBgClass="bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400" label="Total invertido" value={formatCurrency(summary.totalInvested)} index={0} />
          <StatCard icon={<HiChartPie className="h-5 w-5" />} iconBgClass="bg-invest-bg text-invest dark:bg-[rgba(139,92,246,0.12)] dark:text-invest-light" label="Valor actual" value={formatCurrency(summary.totalCurrentValue)} index={1} />
          <StatCard icon={summary.totalReturn >= 0 ? <HiArrowTrendingUp className="h-5 w-5" /> : <HiArrowTrendingDown className="h-5 w-5" />} iconBgClass={summary.totalReturn >= 0 ? 'bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light' : 'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'} label="Rendimiento total" value={formatCurrency(summary.totalReturn)} index={2} />
          <StatCard icon={<HiArrowTrendingUp className="h-5 w-5" />} iconBgClass={summary.returnPercentage >= 0 ? 'bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light' : 'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'} label="Rendimiento %" value={`${(summary.returnPercentage ?? 0) >= 0 ? '+' : ''}${(summary.returnPercentage ?? 0).toFixed(2)}%`} index={3} />
        </div>
      )}

      {investments.length === 0 ? (
        <EmptyState icon={<HiBanknotes className="h-8 w-8" />} title="Sin inversiones" description="Registra tus inversiones para hacer seguimiento de tu portafolio." actionLabel="Agregar Inversion" onAction={modal.openCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-2">
            {investments.map((inv) => {
              const returnAmount = inv.currentValue - inv.amountInvested;
              const returnPct = inv.amountInvested > 0 ? ((returnAmount / inv.amountInvested) * 100) : 0;
              const isPositive = returnAmount >= 0;
              return (
                <div key={inv.id} className="group rounded-xl border border-border-primary bg-surface-card p-5 shadow-card transition-all hover:shadow-card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text-primary truncate">{inv.name}</h3>
                        <Badge variant={getTypeBadgeVariant(inv.type)}>{getTypeLabel(inv.type)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-text-tertiary">Inicio: {formatShortDate(inv.startDate)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(inv)} className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors" aria-label="Editar"><HiPencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteConfirm.requestDelete(inv.id)} className="rounded-lg p-1.5 text-text-tertiary hover:bg-expense-bg hover:text-expense transition-colors" aria-label="Eliminar"><HiTrash className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-text-tertiary">Invertido</p>
                      <p className="text-sm font-medium text-text-secondary">{formatCurrency(inv.amountInvested)}</p>
                      <p className="text-xs text-text-tertiary">Valor actual</p>
                      <p className="text-sm font-medium text-text-primary">{formatCurrency(inv.currentValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${isPositive ? 'text-income' : 'text-expense'}`}>{isPositive ? '+' : ''}{formatCurrency(returnAmount)}</p>
                      <Badge variant={isPositive ? 'income' : 'expense'} className="mt-1">{isPositive ? '+' : ''}{returnPct.toFixed(2)}%</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-4">
            {pieData.length > 0 && (
              <Card title="Distribucion por tipo" padding="md">
                <CategoryPieChart data={pieData} height={300} centerLabel="Portafolio" />
              </Card>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary-300 bg-primary-50/50 p-4 dark:border-primary-700 dark:bg-primary-950/20">
              <HiRocketLaunch className="h-6 w-6 shrink-0 text-primary-500 dark:text-primary-400" />
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-300">Proximamente: datos en tiempo real</p>
                <p className="text-xs text-primary-600 dark:text-primary-400">Sincronizacion automatica de precios y rendimiento de mercado.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.editingId ? 'Editar Inversion' : 'Nueva Inversion'} size="lg" footer={<><Button variant="secondary" onClick={modal.close} disabled={modal.saving}>Cancelar</Button><Button onClick={handleSubmit} loading={modal.saving}>{modal.editingId ? 'Guardar Cambios' : 'Crear Inversion'}</Button></>}>
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Ej: Acciones Apple, CDT Bancolombia..." value={modal.form.name} onChange={(e) => modal.setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select label="Tipo de inversion" options={INVESTMENT_TYPES} value={modal.form.type} onChange={(e) => modal.setForm((f) => ({ ...f, type: e.target.value as InvestmentType }))} />
          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput label="Monto invertido" placeholder="0" value={modal.form.amountInvested} onChange={(v) => modal.setForm((f) => ({ ...f, amountInvested: v }))} />
            <CurrencyInput label="Valor actual (opcional)" placeholder="Igual al invertido" value={modal.form.currentValue} onChange={(v) => modal.setForm((f) => ({ ...f, currentValue: v }))} />
          </div>
          <DatePicker label="Fecha de inicio" value={modal.form.startDate} onChange={(e) => modal.setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Notas (opcional)</label>
            <textarea rows={3} className="block w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0" placeholder="Observaciones sobre esta inversion..." value={modal.form.notes} onChange={(e) => modal.setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={deleteConfirm.deleteId !== null} onClose={deleteConfirm.cancelDelete} onConfirm={deleteConfirm.confirmDelete} title="Eliminar Inversion" message="Estas seguro de que deseas eliminar esta inversion? Esta accion no se puede deshacer." confirmLabel="Eliminar" loading={deleteConfirm.deleting} />
    </div>
  );
}
