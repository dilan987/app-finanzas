import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiCalculator,
  HiCurrencyDollar,
  HiBanknotes,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';
import MonthSelector from '../components/ui/MonthSelector';
import StatCard from '../components/ui/StatCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useUiStore } from '../store/uiStore';
import { budgetsApi } from '../api/budgets.api';
import { categoriesApi } from '../api/categories.api';
import { formatCurrency } from '../utils/formatCurrency';
import type { Category, CreateBudgetData, UpdateBudgetData } from '../types';

interface BudgetItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string | null;
  category: Category | null;
  budgetAmount: number;
  actualAmount: number;
  remainingAmount: number;
  percentage: number;
}

interface ProjectionSummary {
  month: number;
  year: number;
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  totalActualIncome: number;
  totalActualExpenses: number;
  projectedBalance: number;
  actualBalance: number;
  overallPercentage: number;
  unplannedExpenses: number;
  budgets: BudgetItem[];
}

interface BudgetFormState {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  amount: string;
}

const initialForm: BudgetFormState = {
  name: '',
  type: 'EXPENSE',
  categoryId: '',
  amount: '',
};

export default function BudgetsPage() {
  const { currentMonth, currentYear } = useUiStore();

  const [projection, setProjection] = useState<ProjectionSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BudgetFormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetsApi.getSummary({ month: currentMonth, year: currentYear });
      const raw = res.data.data as any;
      if (raw.copiedFromPrevious) {
        toast.success('Se copio la proyeccion del mes anterior automaticamente');
      }
      setProjection({
        month: raw.month,
        year: raw.year,
        totalProjectedIncome: raw.totalProjectedIncome ?? 0,
        totalProjectedExpenses: raw.totalProjectedExpenses ?? 0,
        totalActualIncome: raw.totalActualIncome ?? 0,
        totalActualExpenses: raw.totalActualExpenses ?? 0,
        projectedBalance: raw.projectedBalance ?? 0,
        actualBalance: raw.actualBalance ?? 0,
        overallPercentage: raw.overallPercentage ?? 0,
        unplannedExpenses: raw.unplannedExpenses ?? 0,
        budgets: (raw.budgets ?? []).map((b: any) => ({
          id: b.id,
          name: b.name ?? '',
          type: b.type ?? 'EXPENSE',
          categoryId: b.categoryId ?? null,
          category: b.category ?? null,
          budgetAmount: b.budgetAmount ?? 0,
          actualAmount: b.actualAmount ?? b.spentAmount ?? 0,
          remainingAmount: b.remainingAmount ?? 0,
          percentage: b.percentage ?? 0,
        })),
      });
    } catch {
      toast.error('Error al cargar la proyeccion');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const openCreate = (type: 'INCOME' | 'EXPENSE' = 'EXPENSE') => {
    setEditingId(null);
    setForm({ ...initialForm, type });
    setModalOpen(true);
  };

  const openEdit = (b: BudgetItem) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      type: b.type,
      categoryId: b.categoryId ?? '',
      amount: String(b.budgetAmount),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Ingresa un nombre para el item');
      return;
    }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const data: UpdateBudgetData = { name: form.name.trim(), amount };
        await budgetsApi.update(editingId, data);
        toast.success('Item actualizado');
      } else {
        const data: CreateBudgetData = {
          name: form.name.trim(),
          type: form.type,
          categoryId: form.categoryId || null,
          amount,
          month: currentMonth,
          year: currentYear,
        };
        await budgetsApi.create(data);
        toast.success('Item agregado');
      }
      setModalOpen(false);
      await loadData();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await budgetsApi.delete(deleteId);
      toast.success('Item eliminado');
      setDeleteId(null);
      await loadData();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const handleCategoryChange = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    setForm((f) => ({
      ...f,
      categoryId: catId,
      name: f.name || cat?.name || '',
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  const items = projection?.budgets ?? [];
  const incomeItems = items.filter((i) => i.type === 'INCOME');
  const expenseItems = items.filter((i) => i.type === 'EXPENSE');

  const projIncome = projection?.totalProjectedIncome ?? 0;
  const projExpenses = projection?.totalProjectedExpenses ?? 0;
  const actualIncome = projection?.totalActualIncome ?? 0;
  const actualExpenses = projection?.totalActualExpenses ?? 0;
  const projBalance = projection?.projectedBalance ?? 0;
  const actualBalance = projection?.actualBalance ?? 0;
  const unplanned = projection?.unplannedExpenses ?? 0;
  const overallPct = projection?.overallPercentage ?? 0;

  const renderBudgetSection = (
    sectionItems: BudgetItem[],
    type: 'INCOME' | 'EXPENSE',
    title: string,
    total: number,
    actualTotal: number,
  ) => {
    if (sectionItems.length === 0) return null;
    const diff = total - actualTotal;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title} ({sectionItems.length})</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-secondary">Proyectado: <span className="font-semibold text-text-primary">{formatCurrency(total)}</span></span>
            <span className="text-text-secondary">Real: <span className="font-semibold text-text-primary">{formatCurrency(actualTotal)}</span></span>
            <span className={`font-semibold ${diff >= 0 ? 'text-income' : 'text-expense'}`}>
              {diff >= 0 ? '+' : '-'}{formatCurrency(Math.abs(diff))}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {sectionItems.map((item) => {
            const itemDiff = item.budgetAmount - item.actualAmount;
            const isOver = item.actualAmount > item.budgetAmount;
            return (
              <div
                key={item.id}
                className="group rounded-xl border border-border-primary bg-surface-card p-4 shadow-card transition-all hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.category ? (
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.category.color }}
                      />
                    ) : (
                      <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-surface-tertiary" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">{item.name}</p>
                      {item.category && (
                        <p className="text-xs text-text-tertiary">{item.category.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right text-sm">
                      <p className="text-text-secondary">
                        {formatCurrency(item.budgetAmount)}
                      </p>
                      {item.categoryId ? (
                        <p className="text-text-tertiary text-xs">
                          Real: {formatCurrency(item.actualAmount)}
                        </p>
                      ) : (
                        <p className="text-text-tertiary text-xs">Referencia</p>
                      )}
                    </div>

                    <div className="w-20 text-right">
                      {item.categoryId ? (
                        <p className={`text-sm font-semibold ${
                          isOver ? 'text-expense' : 'text-income'
                        }`}>
                          {isOver ? '-' : '+'}{formatCurrency(Math.abs(itemDiff))}
                        </p>
                      ) : (
                        <span className="text-text-tertiary">&mdash;</span>
                      )}
                    </div>

                    <div className="w-20">
                      {item.categoryId ? (
                        <Badge variant={isOver ? 'critical' : item.percentage > 70 ? 'warning' : 'income'}>
                          {isOver ? (type === 'EXPENSE' ? 'Excedido' : 'Superado') : (item.percentage ?? 0) > 70 ? `${(item.percentage ?? 0).toFixed(0)}%` : 'Bien'}
                        </Badge>
                      ) : (
                        <Badge variant="info">Ref.</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                        aria-label="Editar"
                      >
                        <HiPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="rounded-lg p-1.5 text-text-tertiary hover:bg-expense-bg hover:text-expense transition-colors"
                        aria-label="Eliminar"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {item.categoryId && (
                  <div className="mt-3">
                    <ProgressBar
                      value={Math.min(item.percentage, 100)}
                      animated
                      thresholdColors
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Proyeccion del Mes
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Planifica tus ingresos y gastos, compara con lo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector />
          <Button variant="secondary" icon={<HiPlus className="h-4 w-4" />} onClick={() => openCreate('INCOME')}>
            Ingreso
          </Button>
          <Button icon={<HiPlus className="h-4 w-4" />} onClick={() => openCreate('EXPENSE')}>
            Gasto
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<HiArrowTrendingUp className="h-5 w-5" />}
              iconBgClass="bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light"
              label="Ingresos Proyectados"
              value={formatCurrency(projIncome)}
              index={0}
            />
            <StatCard
              icon={<HiArrowTrendingDown className="h-5 w-5" />}
              iconBgClass="bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light"
              label="Gastos Proyectados"
              value={formatCurrency(projExpenses)}
              index={1}
            />
            <StatCard
              icon={<HiCalculator className="h-5 w-5" />}
              iconBgClass={projBalance >= 0
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
                : 'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
              }
              label="Balance Proyectado"
              value={formatCurrency(projBalance)}
              index={2}
            />
            <StatCard
              icon={<HiCurrencyDollar className="h-5 w-5" />}
              iconBgClass={actualBalance >= 0
                ? 'bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light'
                : 'bg-warning-bg text-warning-dark dark:bg-[rgba(245,158,11,0.12)] dark:text-warning-light'
              }
              label="Balance Real"
              value={formatCurrency(actualBalance)}
              index={3}
            />
          </div>

          {/* Secondary info row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border-primary bg-surface-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Ingreso real</span>
                <span className="text-sm font-bold text-income">{formatCurrency(actualIncome)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border-primary bg-surface-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Gasto real</span>
                <span className="text-sm font-bold text-expense">{formatCurrency(actualExpenses)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border-primary bg-surface-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Gastos no planeados</span>
                <span className="text-sm font-bold text-warning-dark dark:text-warning-light">{formatCurrency(unplanned)}</span>
              </div>
            </div>
          </div>

          {/* Expense execution progress */}
          {projExpenses > 0 && (
            <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  Ejecucion de gastos
                </span>
                <span className={`text-sm font-bold ${
                  overallPct > 100 ? 'text-expense' : 'text-income'
                }`}>
                  {overallPct.toFixed(1)}%
                </span>
              </div>
              <ProgressBar value={Math.min(overallPct, 100)} animated thresholdColors />
              <p className="mt-2 text-xs text-text-tertiary">
                Has gastado {formatCurrency(actualExpenses)} de {formatCurrency(projExpenses)} proyectados
              </p>
            </div>
          )}
        </>
      )}

      {/* Budget items */}
      {items.length === 0 ? (
        <EmptyState
          icon={<HiCalculator className="h-8 w-8" />}
          title="Sin proyeccion"
          description="Agrega tus ingresos y gastos proyectados para planificar el mes."
          actionLabel="Agregar Ingreso"
          onAction={() => openCreate('INCOME')}
        />
      ) : (
        <div className="space-y-8">
          {renderBudgetSection(incomeItems, 'INCOME', 'Ingresos Proyectados', projIncome, actualIncome)}
          {renderBudgetSection(expenseItems, 'EXPENSE', 'Gastos Proyectados', projExpenses, actualExpenses)}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Item' : (form.type === 'INCOME' ? 'Agregar Ingreso Proyectado' : 'Agregar Gasto Proyectado')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Agregar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Categoria (opcional, para rastrear con transacciones reales)"
            options={[
              { value: '', label: 'Sin categoria' },
              ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={form.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
          />
          <Input
            label="Concepto"
            placeholder={form.type === 'INCOME' ? 'Ej: Salario, Freelance...' : 'Ej: Arriendo, Mercado, Netflix...'}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Monto proyectado"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <div className="rounded-lg bg-primary-50 p-3 dark:bg-primary-950/20">
            <p className="text-xs text-primary-700 dark:text-primary-300">
              <HiBanknotes className="mr-1 inline h-3.5 w-3.5" />
              {form.categoryId
                ? `Se comparara con tus ${form.type === 'INCOME' ? 'ingresos' : 'gastos'} reales en esta categoria.`
                : 'Sin categoria: solo se usa como referencia de tu proyeccion.'}
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Item"
        message="Estas seguro de que deseas eliminar este item de la proyeccion?"
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
