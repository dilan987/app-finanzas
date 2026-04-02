import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiArrowPath,
  HiPlay,
  HiPause,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Transacciones Recurrentes
        </h1>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreate}>
          Nueva Recurrencia
        </Button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<HiArrowPath className="h-8 w-8" />}
          title="Sin recurrencias"
          description="Configura pagos o ingresos que se repiten automáticamente."
          actionLabel="Crear Recurrencia"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Descripción</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Categoría</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Monto</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Frecuencia</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Próxima</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <Badge variant={item.type === 'INCOME' ? 'income' : 'expense'}>
                      {item.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {item.category?.name ?? '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${item.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {getFrequencyLabel(item.frequency)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatShortDate(item.nextExecutionDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isActive ? 'income' : 'warning'}>
                      {item.isActive ? 'Activa' : 'Pausada'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={togglingId === item.id}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        aria-label={item.isActive ? 'Pausar' : 'Activar'}
                        title={item.isActive ? 'Pausar' : 'Activar'}
                      >
                        {item.isActive ? <HiPause className="h-4 w-4" /> : <HiPlay className="h-4 w-4" />}
                      </button>
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
              ))}
            </tbody>
          </table>
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
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'EXPENSE', categoryId: '' }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.type === 'EXPENSE'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/30 dark:text-red-400'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'INCOME', categoryId: '' }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.type === 'INCOME'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>
          <Input
            label="Descripción"
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
            label="Categoría"
            options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Seleccionar categoría"
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
              label="Método de pago"
              options={PAYMENT_METHODS}
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
            />
          </div>
          <DatePicker
            label="Próxima ejecución"
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
        message="¿Estás seguro de que deseas eliminar esta recurrencia? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
