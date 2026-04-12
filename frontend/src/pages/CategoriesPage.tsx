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
import Skeleton from '../components/ui/Skeleton';
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

const TYPE_TABS: { value: TransactionType | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'EXPENSE', label: 'Gastos' },
  { value: 'INCOME', label: 'Ingresos' },
];

function isDefaultCategory(category: Category): boolean {
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
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');

  const loadData = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data.data);
    } catch {
      toast.error('Error al cargar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCategories = typeFilter
    ? categories.filter((c) => c.type === typeFilter)
    : categories;

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
        toast.success('Categoria actualizada');
      } else {
        const data: CreateCategoryData = {
          name: form.name.trim(),
          type: form.type,
          icon: form.icon,
          color: form.color,
        };
        const res = await categoriesApi.create(data);
        setCategories((prev) => [...prev, res.data.data]);
        toast.success('Categoria creada');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al guardar categoria');
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
      toast.success('Categoria eliminada');
      setDeleteId(null);
    } catch {
      toast.error('No se pudo eliminar. Puede tener transacciones asociadas.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="180px" height="32px" />
          <Skeleton variant="rectangular" width={160} height={40} />
        </div>
        <Skeleton variant="rectangular" width="100%" height={44} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" height="140px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Categorias</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {categories.length} categorias en total
          </p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreate}>
          Agregar
        </Button>
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-surface-tertiary p-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTypeFilter(tab.value as TransactionType | '')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              typeFilter === tab.value
                ? 'bg-surface-card text-text-primary shadow-xs'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={<HiTag className="h-8 w-8" />}
          title="Sin categorias"
          description={
            typeFilter
              ? 'No hay categorias de este tipo. Crea una nueva.'
              : 'Crea categorias para organizar tus transacciones.'
          }
          actionLabel="Crear Categoria"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredCategories.map((cat) => {
            const isDefault = isDefaultCategory(cat);
            return (
              <Card key={cat.id} padding="md" className="group relative">
                {/* Action buttons (top-right, visible on hover) */}
                {!isDefault && (
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(cat)}
                      className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-primary-600"
                      aria-label="Editar"
                    >
                      <HiPencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-red-600"
                      aria-label="Eliminar"
                    >
                      <HiTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  {/* Icon with colored background */}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.icon ? cat.icon.replace('Hi', '').charAt(0).toUpperCase() : '?'}
                  </div>

                  {/* Name */}
                  <p className="mt-3 text-sm font-semibold text-text-primary">
                    {cat.name}
                  </p>

                  {/* Type Badge */}
                  <div className="mt-2">
                    <Badge variant={cat.type === 'INCOME' ? 'income' : 'expense'}>
                      {cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                    </Badge>
                  </div>

                  {/* Default indicator */}
                  {isDefault && (
                    <p className="mt-1.5 text-xs text-text-tertiary">Por defecto</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Categoria' : 'Nueva Categoria'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Crear Categoria'}
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
            <label className="label">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'EXPENSE' }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.type === 'EXPENSE'
                    ? 'border-expense bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
                    : 'border-border-primary text-text-tertiary hover:bg-surface-secondary'
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'INCOME' }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.type === 'INCOME'
                    ? 'border-income bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light'
                    : 'border-border-primary text-text-tertiary hover:bg-surface-secondary'
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="label">Icono</label>
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                    form.icon === icon
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500/30 dark:border-primary-400 dark:bg-primary-950/30 dark:text-primary-400'
                      : 'border-border-primary text-text-tertiary hover:bg-surface-secondary'
                  }`}
                  title={icon}
                >
                  {icon.replace('Hi', '').charAt(0)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              Seleccionado: {form.icon}
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="label">Color</label>
            <div className="grid grid-cols-10 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-text-tertiary dark:ring-offset-surface-card' : ''
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
          <Card padding="sm" className="bg-surface-secondary">
            <p className="mb-2 text-xs font-medium text-text-tertiary">Vista previa</p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: form.color }}
              >
                {form.icon ? form.icon.replace('Hi', '').charAt(0) : '?'}
              </div>
              <span className="font-medium text-text-primary">
                {form.name || 'Nombre de categoria'}
              </span>
              <Badge variant={form.type === 'EXPENSE' ? 'expense' : 'income'}>
                {form.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
              </Badge>
            </div>
          </Card>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Categoria"
        message="Estas seguro de que deseas eliminar esta categoria? Si tiene transacciones asociadas, la eliminacion podria fallar."
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
