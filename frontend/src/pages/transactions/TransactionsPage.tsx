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

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TransactionForm from '../../components/forms/TransactionForm';

import { useTransactionStore } from '../../store/transactionStore';
import { useDebounce } from '../../hooks/useDebounce';
import { categoriesApi } from '../../api/categories.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';
import { PAYMENT_METHODS, ITEMS_PER_PAGE } from '../../utils/constants';
import type {
  TransactionType,
  PaymentMethod,
  Category,
  Transaction,
  CreateTransactionData,
  TransactionFilters,
} from '../../types';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transacciones</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pagination ? `${pagination.total} transacciones encontradas` : 'Cargando...'}
          </p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreateModal}>
          Nueva Transaccion
        </Button>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Buscar por descripcion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<HiMagnifyingGlass className="h-4 w-4" />}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          icon={<HiFunnel className="h-4 w-4" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-800 dark:text-blue-200">
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

      {/* Filter Bar */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Tipo"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'INCOME', label: 'Ingreso' },
                { value: 'EXPENSE', label: 'Gasto' },
              ]}
            />
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
            <div className="grid grid-cols-2 gap-2">
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
            <DatePicker
              label="Fecha inicio"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <DatePicker
              label="Fecha fin"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Transaction List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="xl" />
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
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Categoria
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Descripcion
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                    Monto
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Metodo
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                  >
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {formatShortDate(tx.date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {tx.category && (
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: tx.category.color }}
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">
                          {tx.category?.name ?? 'Sin categoria'}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[250px] truncate px-5 py-4 text-gray-700 dark:text-gray-300">
                      {tx.description}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="info">{getPaymentMethodLabel(tx.paymentMethod)}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(tx)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
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
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => navigate(`/transactions/${tx.id}`)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {tx.category && (
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: tx.category.color }}
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tx.category?.name ?? 'Sin categoria'}
                    </span>
                  </div>
                  <span
                    className={`text-base font-bold ${
                      tx.type === 'INCOME'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                  {tx.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {formatShortDate(tx.date)}
                  </span>
                  <Badge variant="info">{getPaymentMethodLabel(tx.paymentMethod)}</Badge>
                </div>
              </div>
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
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 md:hidden"
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
