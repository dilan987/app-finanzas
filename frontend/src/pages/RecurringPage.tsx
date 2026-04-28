import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiArrowPath,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CurrencyInput from '../components/ui/CurrencyInput';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Toggle from '../components/ui/Toggle';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import DatePicker from '../components/ui/DatePicker';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { recurringApi } from '../api/recurring.api';
import { categoriesApi } from '../api/categories.api';
import { accountsApi } from '../api/accounts.api';
import { goalsApi } from '../api/goals.api';
import { useFormModal } from '../hooks/useFormModal';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate } from '../utils/formatDate';
import { FREQUENCIES, PAYMENT_METHODS } from '../utils/constants';
import type {
  RecurringTransaction,
  Category,
  Account,
  Goal,
  TransactionType,
  CreateRecurringData,
  UpdateRecurringData,
  Frequency,
  PaymentMethod,
} from '../types';

interface RecurringFormState {
  type: TransactionType;
  amount: string;
  description: string;
  categoryId: string;
  frequency: Frequency;
  nextExecutionDate: string;
  paymentMethod: PaymentMethod;
  accountId: string;
  goalId: string;
}

const initialForm: RecurringFormState = {
  type: 'EXPENSE',
  amount: '',
  description: '',
  categoryId: '',
  frequency: 'MONTHLY',
  nextExecutionDate: new Date().toISOString().split('T')[0] ?? '',
  paymentMethod: 'CASH',
  accountId: '',
  goalId: '',
};

function getFrequencyLabel(freq: Frequency): string {
  return FREQUENCIES.find((f) => f.value === freq)?.label ?? freq;
}

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const modal = useFormModal<RecurringFormState>(initialForm);

  const deleteConfirm = useDeleteConfirm(
    async (id) => {
      await recurringApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    { successMessage: 'Recurrencia eliminada', errorMessage: 'Error al eliminar recurrencia' },
  );

  const loadData = useCallback(async () => {
    try {
      const [recRes, catRes, accRes, goalsRes] = await Promise.all([
        recurringApi.getAll(),
        categoriesApi.getAll(),
        accountsApi.getAll({ isActive: true }),
        goalsApi.getAll({ status: 'ACTIVE', limit: 100 }),
      ]);
      setItems(recRes.data.data);
      setCategories(catRes.data.data);
      setAccounts(accRes.data.data);
      setActiveGoals(goalsRes.data.data);
    } catch {
      toast.error('Error al cargar recurrencias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCategories = categories.filter((c) => c.type === modal.form.type);

  const openEdit = (item: RecurringTransaction) => {
    modal.openEdit(item.id, {
      type: item.type,
      amount: String(item.amount),
      description: item.description ?? '',
      categoryId: item.categoryId,
      frequency: item.frequency,
      nextExecutionDate: item.nextExecutionDate?.split('T')[0] ?? '',
      paymentMethod: item.paymentMethod,
      accountId: item.accountId ?? '',
      goalId: (item as any).goalId ?? '',
    });
  };

  const handleToggle = async (item: RecurringTransaction) => {
    setTogglingId(item.id);
    try {
      const res = await recurringApi.toggle(item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.data.data : i)));
      toast.success(res.data.data.isActive ? 'Recurrencia activada' : 'Recurrencia pausada');
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async () => {
    if (!modal.form.description || !modal.form.amount || !modal.form.categoryId) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    const amount = parseFloat(modal.form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    modal.setSaving(true);
    try {
      const payload = {
        type: modal.form.type,
        amount,
        description: modal.form.description,
        categoryId: modal.form.categoryId,
        frequency: modal.form.frequency,
        nextExecutionDate: modal.form.nextExecutionDate,
        paymentMethod: modal.form.paymentMethod,
        accountId: modal.form.accountId || null,
        goalId: modal.form.goalId || null,
      };
      if (modal.editingId) {
        const res = await recurringApi.update(modal.editingId, payload as UpdateRecurringData);
        setItems((prev) => prev.map((i) => (i.id === modal.editingId ? res.data.data : i)));
        toast.success('Recurrencia actualizada');
      } else {
        const res = await recurringApi.create(payload as CreateRecurringData);
        setItems((prev) => [...prev, res.data.data]);
        toast.success('Recurrencia creada');
      }
      modal.close();
    } catch {
      toast.error('Error al guardar recurrencia');
    } finally {
      modal.setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-tour="recurring-list">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transacciones Recurrentes</h1>
          <p className="mt-1 text-sm text-text-secondary">Gestiona pagos e ingresos que se repiten automaticamente</p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={modal.openCreate}>Nueva Recurrencia</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<HiArrowPath className="h-8 w-8" />} title="Sin recurrencias" description="Configura pagos o ingresos que se repiten automaticamente." actionLabel="Crear Recurrencia" onAction={modal.openCreate} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={`group rounded-xl border border-border-primary bg-surface-card p-4 shadow-card transition-all hover:shadow-card-hover ${!item.isActive ? 'opacity-60' : ''}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Toggle checked={item.isActive} onChange={() => handleToggle(item)} disabled={togglingId === item.id} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary truncate">{item.description}</p>
                      <Badge variant={item.type === 'INCOME' ? 'income' : 'expense'}>{item.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                      {item.category?.name && <span>{item.category.name}</span>}
                      <Badge variant="neutral">{getFrequencyLabel(item.frequency)}</Badge>
                      {item.account && <Badge variant="info">{item.account.name}</Badge>}
                      <span>Proxima: {formatShortDate(item.nextExecutionDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-lg font-bold whitespace-nowrap ${item.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                    {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors" aria-label="Editar"><HiPencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteConfirm.requestDelete(item.id)} className="rounded-lg p-1.5 text-text-tertiary hover:bg-expense-bg hover:text-expense transition-colors" aria-label="Eliminar"><HiTrash className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.editingId ? 'Editar Recurrencia' : 'Nueva Recurrencia'} size="lg" footer={<><Button variant="secondary" onClick={modal.close} disabled={modal.saving}>Cancelar</Button><Button onClick={handleSubmit} loading={modal.saving}>{modal.editingId ? 'Guardar Cambios' : 'Crear Recurrencia'}</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Tipo</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => modal.setForm((f) => ({ ...f, type: 'EXPENSE', categoryId: '' }))} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${modal.form.type === 'EXPENSE' ? 'border-expense bg-expense-bg text-expense' : 'border-border-primary text-text-tertiary hover:bg-surface-tertiary'}`}>Gasto</button>
              <button type="button" onClick={() => modal.setForm((f) => ({ ...f, type: 'INCOME', categoryId: '' }))} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${modal.form.type === 'INCOME' ? 'border-income bg-income-bg text-income' : 'border-border-primary text-text-tertiary hover:bg-surface-tertiary'}`}>Ingreso</button>
            </div>
          </div>
          <Input label="Descripcion" placeholder="Ej: Arriendo, Salario..." value={modal.form.description} onChange={(e) => modal.setForm((f) => ({ ...f, description: e.target.value }))} />
          <CurrencyInput label="Monto" placeholder="0" value={modal.form.amount} onChange={(v) => modal.setForm((f) => ({ ...f, amount: v }))} />
          <Select label="Categoria" options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Seleccionar categoria" value={modal.form.categoryId} onChange={(e) => modal.setForm((f) => ({ ...f, categoryId: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Frecuencia" options={FREQUENCIES} value={modal.form.frequency} onChange={(e) => modal.setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))} />
            <Select label="Metodo de pago" options={PAYMENT_METHODS} value={modal.form.paymentMethod} onChange={(e) => modal.setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))} />
          </div>
          {accounts.length > 0 && (
            <Select label="Cuenta" options={[{ value: '', label: 'Sin cuenta' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} value={modal.form.accountId} onChange={(e) => modal.setForm((f) => ({ ...f, accountId: e.target.value }))} />
          )}
          {(() => {
            const filteredGoals = activeGoals.filter((g) => modal.form.type === 'EXPENSE' ? g.type === 'DEBT' : g.type === 'SAVINGS');
            if (filteredGoals.length === 0) return null;
            return <Select label="Meta (opcional)" value={modal.form.goalId} onChange={(e) => modal.setForm((f) => ({ ...f, goalId: e.target.value }))} options={[{ value: '', label: 'Sin meta' }, ...filteredGoals.map((g) => ({ value: g.id, label: `${g.name} (${Math.round(g.progress)}%)` }))]} />;
          })()}
          <DatePicker label="Proxima ejecucion" value={modal.form.nextExecutionDate} onChange={(e) => modal.setForm((f) => ({ ...f, nextExecutionDate: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={deleteConfirm.deleteId !== null} onClose={deleteConfirm.cancelDelete} onConfirm={deleteConfirm.confirmDelete} title="Eliminar Recurrencia" message="Estas seguro de que deseas eliminar esta recurrencia? Esta accion no se puede deshacer." confirmLabel="Eliminar" loading={deleteConfirm.deleting} />
    </div>
  );
}
