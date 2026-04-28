import { useState, useEffect } from 'react';
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
import { useFormModal } from '../hooks/useFormModal';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useCrudOperations } from '../hooks/useCrudOperations';
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

export default function CategoriesPage() {
  const { items: categories, setItems: setCategories, loading, loadData } = useCrudOperations<Category, CreateCategoryData, UpdateCategoryData>(
    categoriesApi,
    { loadError: 'Error al cargar categorias' },
  );

  const modal = useFormModal<CategoryFormState>(initialForm);
  const deleteConfirm = useDeleteConfirm(
    async (id) => {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    { successMessage: 'Categoria eliminada', errorMessage: 'No se pudo eliminar. Puede tener transacciones asociadas.' },
  );

  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCategories = typeFilter
    ? categories.filter((c) => c.type === typeFilter)
    : categories;

  const openEdit = (cat: Category) => {
    modal.openEdit(cat.id, { name: cat.name, type: cat.type, icon: cat.icon, color: cat.color });
  };

  const handleSubmit = async () => {
    if (!modal.form.name.trim()) return;
    modal.setSaving(true);
    try {
      if (modal.editingId) {
        const data: UpdateCategoryData = { name: modal.form.name.trim(), icon: modal.form.icon, color: modal.form.color, type: modal.form.type };
        const res = await categoriesApi.update(modal.editingId, data);
        setCategories((prev) => prev.map((c) => (c.id === modal.editingId ? res.data.data : c)));
      } else {
        const data: CreateCategoryData = { name: modal.form.name.trim(), type: modal.form.type, icon: modal.form.icon, color: modal.form.color };
        const res = await categoriesApi.create(data);
        setCategories((prev) => [...prev, res.data.data]);
      }
      modal.close();
    } catch { /* toast handled by form */ } finally {
      modal.setSaving(false);
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
    <div className="space-y-6" data-tour="categories-list">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Categorias</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {categories.length} categorias en total
          </p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={modal.openCreate}>
          Agregar
        </Button>
      </div>

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
          description={typeFilter ? 'No hay categorias de este tipo. Crea una nueva.' : 'Crea categorias para organizar tus transacciones.'}
          actionLabel="Crear Categoria"
          onAction={modal.openCreate}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredCategories.map((cat) => {
            const isDefault = !cat.userId;
            return (
              <Card key={cat.id} padding="md" className="group relative">
                {!isDefault && (
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-primary-600" aria-label="Editar">
                      <HiPencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteConfirm.requestDelete(cat.id)} className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-red-600" aria-label="Eliminar">
                      <HiTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white" style={{ backgroundColor: cat.color }}>
                    {cat.icon ? cat.icon.replace('Hi', '').charAt(0).toUpperCase() : '?'}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-text-primary">{cat.name}</p>
                  <div className="mt-2">
                    <Badge variant={cat.type === 'INCOME' ? 'income' : 'expense'}>
                      {cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                    </Badge>
                  </div>
                  {isDefault && <p className="mt-1.5 text-xs text-text-tertiary">Por defecto</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.editingId ? 'Editar Categoria' : 'Nueva Categoria'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={modal.close} disabled={modal.saving}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={modal.saving}>{modal.editingId ? 'Guardar Cambios' : 'Crear Categoria'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Nombre" placeholder="Ej: Transporte, Freelance..." value={modal.form.name} onChange={(e) => modal.setForm((f) => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => modal.setForm((f) => ({ ...f, type: 'EXPENSE' }))} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${modal.form.type === 'EXPENSE' ? 'border-expense bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light' : 'border-border-primary text-text-tertiary hover:bg-surface-secondary'}`}>Gasto</button>
              <button type="button" onClick={() => modal.setForm((f) => ({ ...f, type: 'INCOME' }))} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${modal.form.type === 'INCOME' ? 'border-income bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light' : 'border-border-primary text-text-tertiary hover:bg-surface-secondary'}`}>Ingreso</button>
            </div>
          </div>
          <div>
            <label className="label">Icono</label>
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button key={icon} type="button" onClick={() => modal.setForm((f) => ({ ...f, icon }))} className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${modal.form.icon === icon ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500/30 dark:border-primary-400 dark:bg-primary-950/30 dark:text-primary-400' : 'border-border-primary text-text-tertiary hover:bg-surface-secondary'}`} title={icon}>
                  {icon.replace('Hi', '').charAt(0)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-tertiary">Seleccionado: {modal.form.icon}</p>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="grid grid-cols-10 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => modal.setForm((f) => ({ ...f, color }))} className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${modal.form.color === color ? 'ring-2 ring-offset-2 ring-text-tertiary dark:ring-offset-surface-card' : ''}`} style={{ backgroundColor: color }} title={color}>
                  {modal.form.color === color && <HiCheck className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <Card padding="sm" className="bg-surface-secondary">
            <p className="mb-2 text-xs font-medium text-text-tertiary">Vista previa</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: modal.form.color }}>
                {modal.form.icon ? modal.form.icon.replace('Hi', '').charAt(0) : '?'}
              </div>
              <span className="font-medium text-text-primary">{modal.form.name || 'Nombre de categoria'}</span>
              <Badge variant={modal.form.type === 'EXPENSE' ? 'expense' : 'income'}>{modal.form.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}</Badge>
            </div>
          </Card>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.deleteId !== null}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={deleteConfirm.confirmDelete}
        title="Eliminar Categoria"
        message="Estas seguro de que deseas eliminar esta categoria? Si tiene transacciones asociadas, la eliminacion podria fallar."
        confirmLabel="Eliminar"
        loading={deleteConfirm.deleting}
      />
    </div>
  );
}
