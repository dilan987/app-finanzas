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
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';
import MonthSelector from '../components/ui/MonthSelector';
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

  const renderTable = (
    tableItems: BudgetItem[],
    type: 'INCOME' | 'EXPENSE',
    title: string,
    total: number,
    actualTotal: number,
  ) => {
    if (tableItems.length === 0) return null;
    const diff = total - actualTotal;
    return (
      <Card title={`${title} (${tableItems.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400">Concepto</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Proyectado</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Real</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Diferencia</th>
                <th className="pb-3 text-center font-medium text-gray-500 dark:text-gray-400">Estado</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {tableItems.map((item) => {
                const itemDiff = item.budgetAmount - item.actualAmount;
                const isOver = item.actualAmount > item.budgetAmount;
                return (
                  <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {item.category ? (
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.category.color }}
                          />
                        ) : (
                          <span className="inline-block h-3 w-3 rounded-full bg-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                          {item.category && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.category.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.budgetAmount)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                      {item.categoryId ? formatCurrency(item.actualAmount) : (
                        <span className="text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className={`py-3 text-right font-medium ${
                      !item.categoryId ? 'text-gray-400' : isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {item.categoryId ? (
                        <>{isOver ? '-' : '+'}{formatCurrency(Math.abs(itemDiff))}</>
                      ) : <>&mdash;</>}
                    </td>
                    <td className="py-3 text-center">
                      {item.categoryId ? (
                        <Badge variant={isOver ? 'critical' : item.percentage > 70 ? 'warning' : 'income'}>
                          {isOver ? (type === 'EXPENSE' ? 'Excedido' : 'Superado') : (item.percentage ?? 0) > 70 ? `${(item.percentage ?? 0).toFixed(0)}%` : 'Bien'}
                        </Badge>
                      ) : (
                        <Badge variant="info">Ref.</Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          aria-label="Editar"
                        >
                          <HiPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          aria-label="Eliminar"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                <td className="py-3 font-bold text-gray-900 dark:text-gray-100">TOTAL</td>
                <td className="py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(total)}
                </td>
                <td className="py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(actualTotal)}
                </td>
                <td className={`py-3 text-right font-bold ${
                  diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {diff >= 0 ? '+' : '-'}{formatCurrency(Math.abs(diff))}
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Proyeccion del Mes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <HiArrowTrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos Proyectados</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(projIncome)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                  <HiArrowTrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gastos Proyectados</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(projExpenses)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  projBalance >= 0
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                }`}>
                  <HiCalculator className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Balance Proyectado</p>
                  <p className={`text-lg font-bold ${
                    projBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(projBalance)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  actualBalance >= 0
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                }`}>
                  <HiCurrencyDollar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Balance Real</p>
                  <p className={`text-lg font-bold ${
                    actualBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {formatCurrency(actualBalance)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Secondary info row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card padding="md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Ingreso real</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(actualIncome)}</span>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Gasto real</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(actualExpenses)}</span>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Gastos no planeados</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(unplanned)}</span>
              </div>
            </Card>
          </div>

          {/* Expense execution progress */}
          {projExpenses > 0 && (
            <Card padding="md">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ejecucion de gastos
                </span>
                <span className={`text-sm font-bold ${
                  overallPct > 100 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {overallPct.toFixed(1)}%
                </span>
              </div>
              <ProgressBar value={Math.min(overallPct, 100)} />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Has gastado {formatCurrency(actualExpenses)} de {formatCurrency(projExpenses)} proyectados
              </p>
            </Card>
          )}
        </>
      )}

      {/* Tables */}
      {items.length === 0 ? (
        <EmptyState
          icon={<HiCalculator className="h-8 w-8" />}
          title="Sin proyeccion"
          description="Agrega tus ingresos y gastos proyectados para planificar el mes."
          actionLabel="Agregar Ingreso"
          onAction={() => openCreate('INCOME')}
        />
      ) : (
        <div className="space-y-6">
          {renderTable(incomeItems, 'INCOME', 'Ingresos Proyectados', projIncome, actualIncome)}
          {renderTable(expenseItems, 'EXPENSE', 'Gastos Proyectados', projExpenses, actualExpenses)}
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
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
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
