import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiTag,
  HiCheck,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { categoriesApi } from '../api/categories.api';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/constants';
import type { Category, TransactionType, CreateCategoryData, UpdateCategoryData } from '../types';

interface CategoryFormState {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

const initialForm: CategoryFormState = {
  name: '',
  type: 'EXPENSE',
  icon: CATEGORY_ICONS[0] ?? 'HiHome',
  color: CATEGORY_COLORS[0] ?? '#3b82f6',
};

function isDefaultCategory(category: Category): boolean {
  // Default categories have no userId (or a sentinel value). Heuristic: if created before user,
  // treat categories with userId as custom.  Since backend might mark defaults differently,
  // we use the presence of userId field: defaults may have userId = null or a system id.
  // Fallback: we check if it has no userId or if it was created at app start.
  return !category.userId;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data.data);
    } catch {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const data: UpdateCategoryData = {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
          type: form.type,
        };
        const res = await categoriesApi.update(editingId, data);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? res.data.data : c)));
        toast.success('Categoría actualizada');
      } else {
        const data: CreateCategoryData = {
          name: form.name.trim(),
          type: form.type,
          icon: form.icon,
          color: form.color,
        };
        const res = await categoriesApi.create(data);
        setCategories((prev) => [...prev, res.data.data]);
        toast.success('Categoría creada');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al guardar categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await categoriesApi.delete(deleteId);
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success('Categoría eliminada');
      setDeleteId(null);
    } catch {
      toast.error('No se pudo eliminar. Puede tener transacciones asociadas.');
    } finally {
      setDeleting(false);
    }
  };

  const renderCategoryCard = (cat: Category) => {
    const isDefault = isDefaultCategory(cat);
    return (
      <div
        key={cat.id}
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: cat.color }}
          >
            {cat.icon ? cat.icon.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {cat.name}
              </span>
              {isDefault && (
                <Badge variant="info">Por defecto</Badge>
              )}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">{cat.icon}</span>
          </div>
        </div>
        {!isDefault && (
          <div className="flex gap-1">
            <button
              onClick={() => openEdit(cat)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Editar"
            >
              <HiPencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteId(cat.id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              aria-label="Eliminar"
            >
              <HiTrash className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categorías</h1>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreate}>
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<HiTag className="h-8 w-8" />}
          title="Sin categorías"
          description="Crea categorías para organizar tus transacciones."
          actionLabel="Crear Categoría"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Expense Categories */}
          <Card title="Categorías de Gastos" subtitle={`${expenseCategories.length} categorías`} padding="md">
            {expenseCategories.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Sin categorías de gastos
              </p>
            ) : (
              <div className="space-y-2">
                {expenseCategories.map(renderCategoryCard)}
              </div>
            )}
          </Card>

          {/* Income Categories */}
          <Card title="Categorías de Ingresos" subtitle={`${incomeCategories.length} categorías`} padding="md">
            {incomeCategories.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Sin categorías de ingresos
              </p>
            ) : (
              <div className="space-y-2">
                {incomeCategories.map(renderCategoryCard)}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Categoría' : 'Nueva Categoría'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Nombre"
            placeholder="Ej: Transporte, Freelance..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          {/* Type Toggle */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'EXPENSE' }))}
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
                onClick={() => setForm((f) => ({ ...f, type: 'INCOME' }))}
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

          {/* Icon Picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Icono
            </label>
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                    form.icon === icon
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/30 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  title={icon}
                >
                  {icon.replace('Hi', '').charAt(0)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Seleccionado: {form.icon}
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {form.color === color && <HiCheck className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Vista previa</p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: form.color }}
              >
                {form.icon ? form.icon.replace('Hi', '').charAt(0) : '?'}
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {form.name || 'Nombre de categoría'}
              </span>
              <Badge variant={form.type === 'EXPENSE' ? 'expense' : 'income'}>
                {form.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
              </Badge>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Si tiene transacciones asociadas, la eliminación podría fallar."
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
