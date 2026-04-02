import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiArrowLeft,
  HiPencilSquare,
  HiTrash,
  HiCalendarDays,
  HiCreditCard,
  HiTag,
  HiClock,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TransactionForm from '../../components/forms/TransactionForm';

import { transactionsApi } from '../../api/transactions.api';
import { useTransactionStore } from '../../store/transactionStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatRelativeDate } from '../../utils/formatDate';
import { PAYMENT_METHODS } from '../../utils/constants';
import type { Transaction, CreateTransactionData } from '../../types';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateTransaction, deleteTransaction } = useTransactionStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    transactionsApi
      .getById(id)
      .then((res) => setTransaction(res.data.data))
      .catch(() => {
        toast.error('Error al cargar la transaccion');
        navigate('/transactions');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleUpdate(data: CreateTransactionData) {
    if (!id) return;
    setSubmitting(true);
    try {
      const updated = await updateTransaction(id, data);
      setTransaction(updated);
      setShowEditModal(false);
      toast.success('Transaccion actualizada');
    } catch {
      toast.error('Error al actualizar la transaccion');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteTransaction(id);
      toast.success('Transaccion eliminada');
      navigate('/transactions');
    } catch {
      toast.error('Error al eliminar la transaccion');
    } finally {
      setDeleting(false);
    }
  }

  function getPaymentMethodLabel(value: string): string {
    return PAYMENT_METHODS.find((pm) => pm.value === value)?.label ?? value;
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400">Transaccion no encontrada.</p>
        <Link
          to="/transactions"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <HiArrowLeft className="h-4 w-4" />
          Volver a transacciones
        </Link>
      </div>
    );
  }

  const isIncome = transaction.type === 'INCOME';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back Button */}
      <Link
        to="/transactions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <HiArrowLeft className="h-4 w-4" />
        Volver a transacciones
      </Link>

      {/* Main Card */}
      <Card padding="lg">
        {/* Type Badge + Actions */}
        <div className="flex items-start justify-between">
          <Badge variant={isIncome ? 'income' : 'expense'}>
            {isIncome ? 'Ingreso' : 'Gasto'}
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<HiPencilSquare className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Editar
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<HiTrash className="h-4 w-4" />}
              onClick={() => setShowDeleteDialog(true)}
            >
              Eliminar
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-6 text-center">
          <p
            className={`text-4xl font-bold ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </p>
          <p className="mt-2 text-lg text-gray-700 dark:text-gray-300">
            {transaction.description}
          </p>
        </div>

        {/* Detail Rows */}
        <div className="mt-8 divide-y divide-gray-100 dark:divide-gray-700/50">
          {/* Category */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <HiTag className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Categoria</p>
              <div className="mt-0.5 flex items-center gap-2">
                {transaction.category && (
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: transaction.category.color }}
                  />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {transaction.category?.name ?? 'Sin categoria'}
                </span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <HiCalendarDays className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(transaction.date)}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeDate(transaction.date)}
            </span>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <HiCreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Metodo de pago</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                {getPaymentMethodLabel(transaction.paymentMethod)}
              </p>
            </div>
          </div>

          {/* Created at */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <HiClock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Creada</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeDate(transaction.createdAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Transaccion"
        size="lg"
      >
        <TransactionForm
          initialData={{
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description ?? '',
            date: transaction.date,
            paymentMethod: transaction.paymentMethod,
            categoryId: transaction.categoryId,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          submitLabel="Actualizar"
          loading={submitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
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
