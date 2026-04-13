import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiFunnel,
  HiXMark,
  HiPencilSquare,
  HiTrash,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DatePicker from '../components/ui/DatePicker';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TransactionForm from '../components/forms/TransactionForm';

import { useTransactionStore } from '../store/transactionStore';
import { useDebounce } from '../hooks/useDebounce';
import { categoriesApi } from '../api/categories.api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate } from '../utils/formatDate';
import { PAYMENT_METHODS, ITEMS_PER_PAGE } from '../utils/constants';
import type {
  TransactionType,
  PaymentMethod,
  Category,
  Transaction,
  CreateTransactionData,
  TransactionFilters,
} from '../types';

const TYPE_TABS: { value: TransactionType | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'INCOME', label: 'Ingresos' },
  { value: 'EXPENSE', label: 'Gastos' },
  { value: 'TRANSFER', label: 'Transferencias' },
];

export default function TransactionsPage() {
  const navigate = useNavigate();
  const {
    transactions,
    pagination,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
  } = useTransactionStore();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch categories
  useEffect(() => {
    categoriesApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => toast.error('Error al cargar categorias'));
  }, []);

  // Build filters and fetch
  const buildFilters = useCallback((): TransactionFilters => {
    const filters: TransactionFilters = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    };
    if (typeFilter) filters.type = typeFilter;
    if (categoryFilter) filters.categoryId = categoryFilter;
    if (paymentMethodFilter) filters.paymentMethod = paymentMethodFilter;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
    return filters;
  }, [typeFilter, categoryFilter, paymentMethodFilter, startDate, endDate, minAmount, maxAmount, debouncedSearch, currentPage]);

  useEffect(() => {
    const filters = buildFilters();
    setFilters(filters);
    fetchTransactions(filters);
  }, [buildFilters, fetchTransactions, setFilters]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, paymentMethodFilter, startDate, endDate, minAmount, maxAmount, debouncedSearch]);

  function clearFilters() {
    setTypeFilter('');
    setCategoryFilter('');
    setPaymentMethodFilter('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSearchTerm('');
    setCurrentPage(1);
  }

  const hasActiveFilters = typeFilter || categoryFilter || paymentMethodFilter || startDate || endDate || minAmount || maxAmount || debouncedSearch;

  // Create / Edit
  function openCreateModal() {
    setEditingTransaction(null);
    setShowModal(true);
  }

  function openEditModal(tx: Transaction) {
    setEditingTransaction(tx);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTransaction(null);
  }

  async function handleSubmit(data: CreateTransactionData) {
    setSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
        toast.success('Transaccion actualizada');
      } else {
        await createTransaction(data);
        toast.success('Transaccion creada');
      }
      closeModal();
    } catch {
      toast.error(editingTransaction ? 'Error al actualizar' : 'Error al crear la transaccion');
    } finally {
      setSubmitting(false);
    }
  }

  // Delete
  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteTransaction(deletingId);
      toast.success('Transaccion eliminada');
      setDeletingId(null);
    } catch {
      toast.error('Error al eliminar la transaccion');
    } finally {
      setDeleting(false);
    }
  }

  function getPaymentMethodLabel(value: string): string {
    return PAYMENT_METHODS.find((pm) => pm.value === value)?.label ?? value;
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transacciones</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {pagination ? `${pagination.total} transacciones encontradas` : 'Cargando...'}
          </p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreateModal}>
          Agregar
        </Button>
      </div>

      {/* Type Tabs + Search + Filters */}
      <Card padding="md">
        <div className="flex flex-col gap-4">
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

          {/* Search + date range + filter toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                placeholder="Buscar por descripcion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<HiMagnifyingGlass className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <DatePicker
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Desde"
              />
              <DatePicker
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Hasta"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              icon={<HiFunnel className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950/40 dark:text-primary-400">
                  !
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" icon={<HiXMark className="h-4 w-4" />} onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Advanced Filter Bar */}
      {showFilters && (
        <Card padding="md">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[{ value: '', label: 'Todas' }, ...categoryOptions]}
            />
            <Select
              label="Metodo de pago"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as PaymentMethod | '')}
              options={[
                { value: '', label: 'Todos' },
                ...PAYMENT_METHODS.map((pm) => ({ value: pm.value, label: pm.label })),
              ]}
            />
            <Input
              label="Monto min"
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
            <Input
              label="Monto max"
              type="number"
              placeholder="999999"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Transaction List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="30%" />
                </div>
                <Skeleton variant="rectangular" width={80} height={24} />
              </div>
            </Card>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Sin transacciones"
          description={
            hasActiveFilters
              ? 'No se encontraron transacciones con los filtros seleccionados.'
              : 'Aun no tienes transacciones registradas. Crea tu primera transaccion.'
          }
          actionLabel={hasActiveFilters ? 'Limpiar filtros' : 'Nueva Transaccion'}
          onAction={hasActiveFilters ? clearFilters : openCreateModal}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <Card padding="none" className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Descripcion
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Categoria
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Fecha
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Metodo
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Monto
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="cursor-pointer transition-colors hover:bg-surface-secondary"
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {tx.category && (
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: tx.category.color }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">
                            {tx.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {tx.type === 'TRANSFER'
                        ? 'Transferencia'
                        : tx.category?.name ?? 'Sin categoria'}
                    </td>
                    <td className="px-5 py-4 text-text-tertiary">
                      {formatShortDate(tx.date)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="neutral">{getPaymentMethodLabel(tx.paymentMethod)}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          tx.type === 'INCOME'
                            ? 'text-income'
                            : tx.type === 'TRANSFER'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-expense'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(tx)}
                          className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-primary-600"
                          title="Editar"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-red-600"
                          title="Eliminar"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {transactions.map((tx) => (
              <Card
                key={tx.id}
                padding="md"
                variant="interactive"
              >
                <div onClick={() => navigate(`/transactions/${tx.id}`)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {tx.category && (
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: tx.category.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {tx.description}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {tx.category?.name ?? 'Sin categoria'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-base font-bold ${
                        tx.type === 'INCOME' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                      {formatShortDate(tx.date)}
                    </span>
                    <Badge variant="neutral">{getPaymentMethodLabel(tx.paymentMethod)}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* FAB for mobile */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 md:hidden"
        aria-label="Nueva transaccion"
      >
        <HiPlus className="h-6 w-6" />
      </button>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTransaction ? 'Editar Transaccion' : 'Nueva Transaccion'}
        size="lg"
      >
        <TransactionForm
          initialData={
            editingTransaction
              ? {
                  type: editingTransaction.type,
                  amount: editingTransaction.amount,
                  description: editingTransaction.description ?? '',
                  date: editingTransaction.date,
                  paymentMethod: editingTransaction.paymentMethod,
                  categoryId: editingTransaction.categoryId,
                  accountId: editingTransaction.accountId,
                  transferAccountId: editingTransaction.transferAccountId,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitLabel={editingTransaction ? 'Actualizar' : 'Crear Transaccion'}
          loading={submitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Eliminar Transaccion"
        message="Estas seguro de que deseas eliminar esta transaccion? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
