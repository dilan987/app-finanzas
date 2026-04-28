import { useState, useEffect } from 'react';
import { HiPlus } from 'react-icons/hi2';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AccountCard from '../components/accounts/AccountCard';
import AccountForm from '../components/accounts/AccountForm';
import { useAccountStore } from '../store/accountStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { formatCurrency } from '../utils/formatCurrency';
import type { Account, CreateAccountData, UpdateAccountData } from '../types';

export default function AccountsPage() {
  const { accounts, summary, fetchAccounts, fetchSummary, createAccount, updateAccount, deleteAccount, loading } = useAccountStore();
  const resumeFromModal = useOnboardingStore((s) => s.resumeFromModal);

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [archivingAccount, setArchivingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchSummary();
  }, [fetchAccounts, fetchSummary]);

  useEffect(() => {
    const handler = () => setShowForm(true);
    window.addEventListener('onboarding:create-account', handler);
    return () => window.removeEventListener('onboarding:create-account', handler);
  }, []);

  const closeForm = () => {
    closeForm();
    resumeFromModal();
  };

  const handleCreate = async (data: CreateAccountData | UpdateAccountData) => {
    setSubmitting(true);
    try {
      await createAccount(data as CreateAccountData);
      toast.success('Cuenta creada exitosamente');
      closeForm();
    } catch {
      toast.error('Error al crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: CreateAccountData | UpdateAccountData) => {
    if (!editingAccount) return;
    setSubmitting(true);
    try {
      await updateAccount(editingAccount.id, data as UpdateAccountData);
      toast.success('Cuenta actualizada');
      setEditingAccount(null);
    } catch {
      toast.error('Error al actualizar la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!archivingAccount) return;
    try {
      await deleteAccount(archivingAccount.id);
      toast.success('Cuenta archivada');
      setArchivingAccount(null);
    } catch {
      toast.error('Error al archivar la cuenta');
    }
  };

  const onBudget = accounts.filter((a) => a.includeInBudget);
  const offBudget = accounts.filter((a) => !a.includeInBudget);

  if (loading && accounts.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour="accounts-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cuentas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona tus cuentas bancarias, tarjetas y billeteras
          </p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={() => setShowForm(true)}>
          Nueva cuenta
        </Button>
      </div>

      {/* Net Worth Summary */}
      {summary && summary.accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border-primary bg-surface-card p-5 shadow-card">
            <p className="text-sm font-medium text-text-secondary">Patrimonio neto</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
              {formatCurrency(summary.netWorth)}
            </p>
          </div>
          <div className="rounded-xl border border-border-primary bg-surface-card p-5 shadow-card">
            <p className="text-sm font-medium text-text-secondary">En presupuesto</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-income dark:text-income-light">
              {formatCurrency(summary.onBudgetTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-border-primary bg-surface-card p-5 shadow-card">
            <p className="text-sm font-medium text-text-secondary">Seguimiento</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
              {formatCurrency(summary.offBudgetTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <EmptyState
          title="Sin cuentas"
          description="Agrega tus cuentas bancarias, tarjetas de credito, neobancos y billeteras para tener el control total de tus finanzas."
          actionLabel="Crear primera cuenta"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* On-budget */}
          {onBudget.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
                Presupuesto ({onBudget.length})
              </h2>
              <div className="space-y-2">
                {onBudget.map((account, i) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={setEditingAccount}
                    onArchive={setArchivingAccount}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Off-budget */}
          {offBudget.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
                Seguimiento ({offBudget.length})
              </h2>
              <div className="space-y-2">
                {offBudget.map((account, i) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={setEditingAccount}
                    onArchive={setArchivingAccount}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => closeForm()}
        title="Nueva cuenta"
        size="lg"
      >
        <AccountForm
          onSubmit={handleCreate}
          onCancel={() => closeForm()}
          loading={submitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        title="Editar cuenta"
        size="lg"
      >
        <AccountForm
          account={editingAccount}
          onSubmit={handleUpdate}
          onCancel={() => setEditingAccount(null)}
          loading={submitting}
        />
      </Modal>

      {/* Archive Confirm */}
      <ConfirmDialog
        isOpen={!!archivingAccount}
        onClose={() => setArchivingAccount(null)}
        onConfirm={handleArchive}
        title="Archivar cuenta"
        message={`¿Estas seguro de archivar "${archivingAccount?.name}"? La cuenta dejara de aparecer en las listas activas, pero sus transacciones se conservaran.`}
        confirmLabel="Archivar"
        variant="danger"
      />
    </div>
  );
}
