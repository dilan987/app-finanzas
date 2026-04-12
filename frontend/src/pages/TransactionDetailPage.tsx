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

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TransactionForm from '../components/forms/TransactionForm';

import { transactionsApi } from '../api/transactions.api';
import { useTransactionStore } from '../store/transactionStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatRelativeDate } from '../utils/formatDate';
import { PAYMENT_METHODS } from '../utils/constants';
import type { Transaction, CreateTransactionData } from '../types';

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
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton variant="text" width="140px" />
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <Skeleton variant="rectangular" width={80} height={24} />
            <div className="flex gap-2">
              <Skeleton variant="rectangular" width={90} height={36} />
              <Skeleton variant="rectangular" width={100} height={36} />
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <Skeleton variant="text" width="200px" height="40px" />
            <Skeleton variant="text" width="160px" />
          </div>
          <div className="mt-8 space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="50%" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-text-secondary">Transaccion no encontrada.</p>
        <Link
          to="/transactions"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-tertiary transition-colors hover:text-text-primary"
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
        <div className="mt-8 text-center">
          <p
            className={`text-4xl font-bold ${
              isIncome ? 'text-income' : 'text-expense'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </p>
          {transaction.description && (
            <p className="mt-2 text-lg text-text-secondary">
              {transaction.description}
            </p>
          )}
        </div>

        {/* Detail Rows */}
        <div className="mt-8 divide-y divide-border-primary">
          {/* Category */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tertiary">
              <HiTag className="h-5 w-5 text-text-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-tertiary">Categoria</p>
              <div className="mt-0.5 flex items-center gap-2">
                {transaction.category && (
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: transaction.category.color }}
                  />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {transaction.category?.name ?? 'Sin categoria'}
                </span>
              </div>
            </div>
            {transaction.category && (
              <Badge variant={isIncome ? 'income' : 'expense'}>
                {isIncome ? 'Ingreso' : 'Gasto'}
              </Badge>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tertiary">
              <HiCalendarDays className="h-5 w-5 text-text-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-tertiary">Fecha</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {formatDate(transaction.date)}
              </p>
            </div>
            <span className="text-xs text-text-tertiary">
              {formatRelativeDate(transaction.date)}
            </span>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tertiary">
              <HiCreditCard className="h-5 w-5 text-text-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-tertiary">Metodo de pago</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {getPaymentMethodLabel(transaction.paymentMethod)}
              </p>
            </div>
            <Badge variant="neutral">
              {getPaymentMethodLabel(transaction.paymentMethod)}
            </Badge>
          </div>

          {/* Created at */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tertiary">
              <HiClock className="h-5 w-5 text-text-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-tertiary">Creada</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
            <span className="text-xs text-text-tertiary">
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
