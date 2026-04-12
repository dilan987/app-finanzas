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
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate } from '../utils/formatDate';
import { FREQUENCIES, PAYMENT_METHODS } from '../utils/constants';
import type {
  RecurringTransaction,
  Category,
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
}

const initialForm: RecurringFormState = {
  type: 'EXPENSE',
  amount: '',
  description: '',
  categoryId: '',
  frequency: 'MONTHLY',
  nextExecutionDate: new Date().toISOString().split('T')[0] ?? '',
  paymentMethod: 'CASH',
};

function getFrequencyLabel(freq: Frequency): string {
  return FREQUENCIES.find((f) => f.value === freq)?.label ?? freq;
}

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringFormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [recRes, catRes] = await Promise.all([
        recurringApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setItems(recRes.data.data);
      setCategories(catRes.data.data);
    } catch {
      toast.error('Error al cargar recurrencias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (item: RecurringTransaction) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      amount: String(item.amount),
      description: item.description ?? '',
      categoryId: item.categoryId,
      frequency: item.frequency,
      nextExecutionDate: item.nextExecutionDate?.split('T')[0] ?? '',
      paymentMethod: item.paymentMethod,
    });
    setModalOpen(true);
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
    if (!form.description || !form.amount || !form.categoryId) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const data: UpdateRecurringData = {
          type: form.type,
          amount,
          description: form.description,
          categoryId: form.categoryId,
          frequency: form.frequency,
          nextExecutionDate: form.nextExecutionDate,
          paymentMethod: form.paymentMethod,
        };
        const res = await recurringApi.update(editingId, data);
        setItems((prev) => prev.map((i) => (i.id === editingId ? res.data.data : i)));
        toast.success('Recurrencia actualizada');
      } else {
        const data: CreateRecurringData = {
          type: form.type,
          amount,
          description: form.description,
          categoryId: form.categoryId,
          frequency: form.frequency,
          nextExecutionDate: form.nextExecutionDate,
          paymentMethod: form.paymentMethod,
        };
        const res = await recurringApi.create(data);
        setItems((prev) => [...prev, res.data.data]);
        toast.success('Recurrencia creada');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al guardar recurrencia');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await recurringApi.delete(deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success('Recurrencia eliminada');
      setDeleteId(null);
    } catch {
      toast.error('Error al eliminar recurrencia');
    } finally {
      setDeleting(false);
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Transacciones Recurrentes
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gestiona pagos e ingresos que se repiten automaticamente
          </p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreate}>
          Nueva Recurrencia
        </Button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<HiArrowPath className="h-8 w-8" />}
          title="Sin recurrencias"
          description="Configura pagos o ingresos que se repiten automaticamente."
          actionLabel="Crear Recurrencia"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group rounded-xl border border-border-primary bg-surface-card p-4 shadow-card transition-all hover:shadow-card-hover ${
                !item.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Toggle
                    checked={item.isActive}
                    onChange={() => handleToggle(item)}
                    disabled={togglingId === item.id}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary truncate">{item.description}</p>
                      <Badge variant={item.type === 'INCOME' ? 'income' : 'expense'}>
                        {item.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                      {item.category?.name && <span>{item.category.name}</span>}
                      <Badge variant="neutral">{getFrequencyLabel(item.frequency)}</Badge>
                      <span>Proxima: {formatShortDate(item.nextExecutionDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-4">
                  <p className={`text-lg font-bold whitespace-nowrap ${
                    item.type === 'INCOME' ? 'text-income' : 'text-expense'
                  }`}>
                    {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>

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
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Recurrencia' : 'Nueva Recurrencia'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Crear Recurrencia'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'EXPENSE', categoryId: '' }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.type === 'EXPENSE'
                    ? 'border-expense bg-expense-bg text-expense'
                    : 'border-border-primary text-text-tertiary hover:bg-surface-tertiary'
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'INCOME', categoryId: '' }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.type === 'INCOME'
                    ? 'border-income bg-income-bg text-income'
                    : 'border-border-primary text-text-tertiary hover:bg-surface-tertiary'
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>
          <Input
            label="Descripcion"
            placeholder="Ej: Arriendo, Salario..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Monto"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <Select
            label="Categoria"
            options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Seleccionar categoria"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Frecuencia"
              options={FREQUENCIES}
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))}
            />
            <Select
              label="Metodo de pago"
              options={PAYMENT_METHODS}
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
            />
          </div>
          <DatePicker
            label="Proxima ejecucion"
            value={form.nextExecutionDate}
            onChange={(e) => setForm((f) => ({ ...f, nextExecutionDate: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Recurrencia"
        message="Estas seguro de que deseas eliminar esta recurrencia? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
