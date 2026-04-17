import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiFlag,
  HiCreditCard,
  HiBanknotes,
  HiCheckCircle,
  HiXCircle,
  HiArrowTrendingUp,
  HiLink,
  HiEye,
  HiXMark,
  HiCalendar,
  HiTrash,
  HiSparkles,
  HiClock,
  HiChartBar,
} from 'react-icons/hi2';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CurrencyInput from '../components/ui/CurrencyInput';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { goalsApi } from '../api/goals.api';
import { formatCurrency } from '../utils/formatCurrency';
import { GOAL_STATUSES, CONTRIBUTION_FREQUENCIES } from '../utils/constants';
import type {
  Goal,
  GoalProjection,
  GoalType,
  GoalStatus,
  ContributionFrequency,
  CreateGoalData,
  UpdateGoalData,
} from '../types';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getMonthLabel(month: number | null): string {
  if (month == null) return '';
  return MONTHS[month - 1] ?? '';
}

function getStatusBadge(status: GoalStatus): { variant: 'info' | 'income' | 'neutral'; label: string } {
  const s = GOAL_STATUSES.find((st) => st.value === status);
  switch (status) {
    case 'ACTIVE': return { variant: 'info', label: s?.label ?? 'Activa' };
    case 'COMPLETED': return { variant: 'income', label: s?.label ?? 'Completada' };
    case 'CANCELLED': return { variant: 'neutral', label: s?.label ?? 'Cancelada' };
    default: return { variant: 'neutral', label: status };
  }
}

function getTypeInfo(type: GoalType): { label: string; icon: React.ReactNode; variant: 'expense' | 'income' } {
  if (type === 'DEBT') {
    return { label: 'Deuda', icon: <HiCreditCard className="h-4 w-4" />, variant: 'expense' };
  }
  return { label: 'Ahorro', icon: <HiBanknotes className="h-4 w-4" />, variant: 'income' };
}

function getFrequencyLabel(freq: ContributionFrequency | null): string {
  if (!freq) return '';
  return CONTRIBUTION_FREQUENCIES.find((f) => f.value === freq)?.label ?? freq;
}

function getPaceColor(pace: GoalProjection['paceStatus']): string {
  switch (pace) {
    case 'ahead': return 'text-income dark:text-income-light';
    case 'behind': return 'text-warning-dark dark:text-warning-light';
    case 'on_track': return 'text-primary-600 dark:text-primary-400';
    default: return 'text-text-tertiary';
  }
}

function getPaceBg(pace: GoalProjection['paceStatus']): string {
  switch (pace) {
    case 'ahead': return 'bg-income-bg dark:bg-[rgba(5,150,105,0.12)]';
    case 'behind': return 'bg-warning-bg dark:bg-[rgba(245,158,11,0.12)]';
    case 'on_track': return 'bg-primary-50 dark:bg-primary-950/20';
    default: return 'bg-surface-secondary';
  }
}

interface GoalFormState {
  name: string;
  description: string;
  type: GoalType;
  targetAmount: string;
  // DEBT fields
  plannedInstallments: string;
  startMonth: string;
  startYear: string;
  // SAVINGS fields
  contributionFrequency: string;
  plannedContribution: string;
}

const now = new Date();
const initialForm: GoalFormState = {
  name: '',
  description: '',
  type: 'SAVINGS',
  targetAmount: '',
  plannedInstallments: '',
  startMonth: String(now.getMonth() + 1),
  startYear: String(now.getFullYear()),
  contributionFrequency: '',
  plannedContribution: '',
};

type TabFilter = 'ALL' | GoalStatus;

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalFormState>(initialForm);
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailProjection, setDetailProjection] = useState<GoalProjection | null>(null);

  // Projections cache for cards
  const [projections, setProjections] = useState<Record<string, GoalProjection>>({});

  // Cancel confirmation
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Link transaction
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkGoalId, setLinkGoalId] = useState<string | null>(null);
  const [linkTransactionId, setLinkTransactionId] = useState('');
  const [linking, setLinking] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      const res = await goalsApi.getAll({ limit: 100 });
      setGoals(res.data.data);
    } catch {
      toast.error('Error al cargar metas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projections for SAVINGS goals
  const loadProjections = useCallback(async (goalsList: Goal[]) => {
    const savingsGoals = goalsList.filter((g) => g.type === 'SAVINGS' && g.status === 'ACTIVE');
    if (savingsGoals.length === 0) return;

    const results: Record<string, GoalProjection> = {};
    await Promise.allSettled(
      savingsGoals.map(async (g) => {
        try {
          const res = await goalsApi.getProjection(g.id);
          results[g.id] = res.data.data;
        } catch { /* ignore individual failures */ }
      }),
    );
    setProjections(results);
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    if (goals.length > 0) {
      loadProjections(goals);
    }
  }, [goals, loadProjections]);

  const filteredGoals = activeTab === 'ALL'
    ? goals
    : goals.filter((g) => g.status === activeTab);

  // Stats
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED');
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalPaid = activeGoals.reduce((sum, g) => sum + g.totalPaid, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 10000) / 100 : 0;

  // ── Create / Edit ────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      description: goal.description ?? '',
      type: goal.type,
      targetAmount: String(goal.targetAmount),
      plannedInstallments: goal.plannedInstallments != null ? String(goal.plannedInstallments) : '',
      startMonth: goal.startMonth != null ? String(goal.startMonth) : String(now.getMonth() + 1),
      startYear: goal.startYear != null ? String(goal.startYear) : String(now.getFullYear()),
      contributionFrequency: goal.contributionFrequency ?? '',
      plannedContribution: goal.plannedContribution != null ? String(goal.plannedContribution) : '',
    });
    setModalOpen(true);
  };

  const handleTypeChange = (newType: GoalType) => {
    setForm((f) => ({
      ...f,
      type: newType,
      // Reset type-specific fields
      plannedInstallments: '',
      contributionFrequency: '',
      plannedContribution: '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const targetAmount = parseFloat(form.targetAmount);
    if (!editingId && (isNaN(targetAmount) || targetAmount <= 0)) {
      toast.error('El monto objetivo debe ser mayor a 0');
      return;
    }

    // Type-specific validation
    if (form.type === 'DEBT' && !editingId) {
      const installments = parseInt(form.plannedInstallments);
      if (isNaN(installments) || installments < 1) {
        toast.error('Las cuotas deben ser al menos 1');
        return;
      }
    }

    // Contribution pair validation for SAVINGS
    if (form.type === 'SAVINGS') {
      const hasFreq = form.contributionFrequency !== '';
      const hasAmount = form.plannedContribution !== '' && parseFloat(form.plannedContribution) > 0;
      if (hasFreq !== hasAmount) {
        toast.error('Define tanto la frecuencia como el monto del aporte, o deja ambos vacios');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        const data: UpdateGoalData = {
          name: form.name.trim(),
          description: form.description.trim() || null,
        };
        if (form.type === 'DEBT' && form.plannedInstallments) {
          data.plannedInstallments = parseInt(form.plannedInstallments);
        }
        if (form.type === 'SAVINGS') {
          data.contributionFrequency = form.contributionFrequency
            ? (form.contributionFrequency as ContributionFrequency)
            : null;
          data.plannedContribution = form.plannedContribution
            ? parseFloat(form.plannedContribution)
            : null;
        }
        const res = await goalsApi.update(editingId, data);
        setGoals((prev) => prev.map((g) => (g.id === editingId ? res.data.data : g)));
        toast.success('Meta actualizada');
      } else {
        let data: CreateGoalData;
        if (form.type === 'DEBT') {
          data = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            type: 'DEBT',
            targetAmount,
            plannedInstallments: parseInt(form.plannedInstallments),
            startMonth: parseInt(form.startMonth),
            startYear: parseInt(form.startYear),
          };
        } else {
          data = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            type: 'SAVINGS',
            targetAmount,
            ...(form.contributionFrequency && form.plannedContribution
              ? {
                  contributionFrequency: form.contributionFrequency as ContributionFrequency,
                  plannedContribution: parseFloat(form.plannedContribution),
                }
              : {}),
          };
        }
        const res = await goalsApi.create(data);
        setGoals((prev) => [res.data.data, ...prev]);
        toast.success('Meta creada');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al guardar meta');
    } finally {
      setSaving(false);
    }
  };

  // ── Detail ──────────────────────────────────────────────────

  const openDetail = async (goalId: string) => {
    setDetailLoading(true);
    setDetailProjection(null);
    try {
      const [goalRes, projRes] = await Promise.allSettled([
        goalsApi.getById(goalId),
        goalsApi.getProjection(goalId),
      ]);
      if (goalRes.status === 'fulfilled') {
        setDetailGoal(goalRes.value.data.data);
      }
      if (projRes.status === 'fulfilled') {
        setDetailProjection(projRes.value.data.data);
      }
    } catch {
      toast.error('Error al cargar detalle de meta');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailGoal(null);
    setDetailProjection(null);
  };

  // ── Cancel ──────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const res = await goalsApi.cancel(cancelId);
      setGoals((prev) => prev.map((g) => (g.id === cancelId ? { ...g, ...res.data.data, totalPaid: g.totalPaid, progress: g.progress } : g)));
      toast.success('Meta cancelada');
      setCancelId(null);
      if (detailGoal?.id === cancelId) closeDetail();
    } catch {
      toast.error('Error al cancelar meta');
    } finally {
      setCancelling(false);
    }
  };

  // ── Link Transaction ─────────────────────────────────────────

  const openLinkModal = (goalId: string) => {
    setLinkGoalId(goalId);
    setLinkTransactionId('');
    setLinkModalOpen(true);
  };

  const handleLink = async () => {
    if (!linkGoalId || !linkTransactionId.trim()) {
      toast.error('Ingresa el ID de la transaccion');
      return;
    }
    setLinking(true);
    try {
      const res = await goalsApi.linkTransaction(linkGoalId, linkTransactionId.trim());
      if (res.data.data.goalCompleted) {
        toast.success('Meta completada! La transaccion fue vinculada y la meta alcanzo su objetivo.', { duration: 5000 });
      } else {
        toast.success('Transaccion vinculada exitosamente');
      }
      setLinkModalOpen(false);
      await loadGoals();
      if (detailGoal?.id === linkGoalId) {
        await openDetail(linkGoalId);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al vincular transaccion';
      toast.error(msg);
    } finally {
      setLinking(false);
    }
  };

  // ── Unlink Transaction ───────────────────────────────────────

  const handleUnlink = async (goalId: string, transactionId: string) => {
    try {
      await goalsApi.unlinkTransaction(goalId, transactionId);
      toast.success('Transaccion desvinculada');
      await loadGoals();
      if (detailGoal?.id === goalId) {
        await openDetail(goalId);
      }
    } catch {
      toast.error('Error al desvincular transaccion');
    }
  };

  // ── Compute suggested installment preview (DEBT only) ────────

  const previewInstallment = (() => {
    if (form.type !== 'DEBT') return null;
    const t = parseFloat(form.targetAmount);
    const i = parseInt(form.plannedInstallments);
    if (!isNaN(t) && t > 0 && !isNaN(i) && i > 0) {
      return Math.round((t / i) * 100) / 100;
    }
    return null;
  })();

  // ── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 sm:p-6 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Metas</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gestiona tus metas de ahorro y pago de deudas
          </p>
        </div>
        <Button icon={<HiPlus className="h-4 w-4" />} onClick={openCreate}>
          Nueva Meta
        </Button>
      </div>

      {/* Summary Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={<HiFlag className="h-5 w-5" />}
            iconBgClass="bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400"
            label="Metas activas"
            value={String(activeGoals.length)}
            index={0}
          />
          <StatCard
            icon={<HiCheckCircle className="h-5 w-5" />}
            iconBgClass="bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light"
            label="Completadas"
            value={String(completedGoals.length)}
            index={1}
          />
          <StatCard
            icon={<HiArrowTrendingUp className="h-5 w-5" />}
            iconBgClass="bg-invest-bg text-invest dark:bg-[rgba(139,92,246,0.12)] dark:text-invest-light"
            label="Total pagado"
            value={formatCurrency(totalPaid)}
            index={2}
          />
          <StatCard
            icon={<HiBanknotes className="h-5 w-5" />}
            iconBgClass="bg-warning-bg text-warning-dark dark:bg-[rgba(245,158,11,0.12)] dark:text-warning-light"
            label="Progreso global"
            value={`${overallProgress}%`}
            index={3}
          />
        </div>
      )}

      {/* Filter Tabs */}
      {goals.length > 0 && (
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-secondary p-1">
          {([
            { key: 'ALL' as TabFilter, label: 'Todas', count: goals.length },
            { key: 'ACTIVE' as TabFilter, label: 'Activas', count: activeGoals.length },
            { key: 'COMPLETED' as TabFilter, label: 'Completadas', count: completedGoals.length },
            { key: 'CANCELLED' as TabFilter, label: 'Canceladas', count: goals.filter((g) => g.status === 'CANCELLED').length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-surface-card text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                  : 'bg-surface-tertiary text-text-tertiary'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Goal Cards */}
      {goals.length === 0 ? (
        <EmptyState
          icon={<HiFlag className="h-8 w-8" />}
          title="Sin metas"
          description="Crea tu primera meta de ahorro o pago de deuda para empezar a hacer seguimiento."
          actionLabel="Crear Meta"
          onAction={openCreate}
        />
      ) : filteredGoals.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-tertiary">No hay metas en esta categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredGoals.map((goal, i) => {
            const typeInfo = getTypeInfo(goal.type);
            const statusBadge = getStatusBadge(goal.status);
            const projection = projections[goal.id];

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group rounded-xl border border-border-primary bg-surface-card p-5 shadow-card transition-all hover:shadow-card-hover"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text-primary truncate">{goal.name}</h3>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </div>
                    {goal.description && (
                      <p className="mt-1 text-xs text-text-tertiary line-clamp-1">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openDetail(goal.id)}
                      className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                      aria-label="Ver detalle"
                    >
                      <HiEye className="h-4 w-4" />
                    </button>
                    {goal.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => openEdit(goal)}
                          className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                          aria-label="Editar"
                        >
                          <HiPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openLinkModal(goal.id)}
                          className="rounded-lg p-1.5 text-text-tertiary hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/30 dark:hover:text-primary-400 transition-colors"
                          aria-label="Vincular transaccion"
                        >
                          <HiLink className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                    <span>{formatCurrency(goal.totalPaid)} de {formatCurrency(goal.targetAmount)}</span>
                    <span className="font-semibold">{goal.progress}%</span>
                  </div>
                  <ProgressBar value={goal.progress} showLabel={false} size="md" thresholdColors={false} />
                </div>

                {/* Bottom info — adapts by type */}
                <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary">
                  {goal.type === 'DEBT' ? (
                    <>
                      <div className="flex items-center gap-1">
                        <HiCalendar className="h-3.5 w-3.5" />
                        <span>
                          {getMonthLabel(goal.startMonth)} {goal.startYear} - {getMonthLabel(goal.projectedEndMonth)} {goal.projectedEndYear}
                        </span>
                      </div>
                      <span className="font-medium text-text-secondary">
                        {formatCurrency(goal.suggestedInstallment ?? 0)}/mes
                      </span>
                    </>
                  ) : (
                    <>
                      {goal.contributionFrequency && goal.plannedContribution != null ? (
                        <div className="flex items-center gap-1">
                          <HiClock className="h-3.5 w-3.5" />
                          <span>
                            {formatCurrency(goal.plannedContribution)}/{getFrequencyLabel(goal.contributionFrequency).toLowerCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <HiSparkles className="h-3.5 w-3.5" />
                          <span>Meta libre</span>
                        </div>
                      )}
                      {projection && projection.plannedMonthsRemaining != null ? (
                        <span className="font-medium text-text-secondary">
                          ~{projection.plannedMonthsRemaining} meses
                        </span>
                      ) : projection && projection.historicalMonthsRemaining != null ? (
                        <span className="font-medium text-text-secondary">
                          ~{projection.historicalMonthsRemaining} meses
                        </span>
                      ) : null}
                    </>
                  )}
                </div>

                {/* Projection insight for SAVINGS cards */}
                {goal.type === 'SAVINGS' && projection && projection.insightMessages.length > 0 && (
                  <div className={`mt-3 rounded-lg p-2.5 ${getPaceBg(projection.paceStatus)}`}>
                    <p className={`text-xs ${getPaceColor(projection.paceStatus)}`}>
                      {projection.insightMessages[0]}
                    </p>
                  </div>
                )}

                {/* Quick actions for mobile */}
                <div className="mt-3 flex gap-2 sm:hidden">
                  <button
                    onClick={() => openDetail(goal.id)}
                    className="flex-1 rounded-lg bg-surface-secondary py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
                  >
                    Ver detalle
                  </button>
                  {goal.status === 'ACTIVE' && (
                    <button
                      onClick={() => openLinkModal(goal.id)}
                      className="flex-1 rounded-lg bg-primary-50 py-2 text-xs font-medium text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 transition-colors"
                    >
                      Vincular
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit Modal ──────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Meta' : 'Nueva Meta'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Crear Meta'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la meta"
            placeholder="Ej: Pagar tarjeta Visa, Ahorro viaje..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          {/* Type selector — only on create */}
          {!editingId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Tipo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('DEBT')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    form.type === 'DEBT'
                      ? 'border-expense bg-expense-bg text-expense dark:border-expense-light dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
                      : 'border-border-primary text-text-tertiary hover:bg-surface-tertiary'
                  }`}
                >
                  <HiCreditCard className="h-4 w-4" />
                  Deuda
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('SAVINGS')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    form.type === 'SAVINGS'
                      ? 'border-income bg-income-bg text-income dark:border-income-light dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light'
                      : 'border-border-primary text-text-tertiary hover:bg-surface-tertiary'
                  }`}
                >
                  <HiBanknotes className="h-4 w-4" />
                  Ahorro
                </button>
              </div>
            </div>
          )}

          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Descripcion (opcional)
            </label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0"
              placeholder="Notas sobre esta meta..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {!editingId && (
            <CurrencyInput
              label="Monto objetivo"
              placeholder="0"
              value={form.targetAmount}
              onChange={(v) => setForm((f) => ({ ...f, targetAmount: v }))}
            />
          )}

          {/* ── DEBT-specific fields ── */}
          {form.type === 'DEBT' && (
            <>
              <Input
                label="Cuotas planificadas"
                placeholder="Ej: 6"
                value={form.plannedInstallments}
                onChange={(e) => setForm((f) => ({ ...f, plannedInstallments: e.target.value.replace(/\D/g, '') }))}
              />

              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Mes de inicio"
                    options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                    value={form.startMonth}
                    onChange={(e) => setForm((f) => ({ ...f, startMonth: e.target.value }))}
                  />
                  <Input
                    label="Ano de inicio"
                    value={form.startYear}
                    onChange={(e) => setForm((f) => ({ ...f, startYear: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              )}

              {/* DEBT installment preview */}
              {previewInstallment !== null && (
                <div className="rounded-lg border border-dashed border-primary-300 bg-primary-50/50 p-3 dark:border-primary-700 dark:bg-primary-950/20">
                  <p className="text-sm text-primary-800 dark:text-primary-300">
                    Cuota sugerida: <span className="font-semibold">{formatCurrency(previewInstallment)}</span>/mes
                  </p>
                  <p className="mt-0.5 text-xs text-primary-600 dark:text-primary-400">
                    Esto es solo una referencia. Puedes pagar mas o menos en cada mes.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── SAVINGS-specific fields ── */}
          {form.type === 'SAVINGS' && (
            <>
              <div className="rounded-lg border border-dashed border-income bg-income-bg/50 p-3 dark:border-income-light dark:bg-[rgba(5,150,105,0.08)]">
                <p className="text-xs text-income dark:text-income-light">
                  Para metas de ahorro, define opcionalmente cada cuanto y cuanto planeas aportar.
                  El sistema analizara tu historial de ingresos para darte proyecciones.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Frecuencia de aporte (opcional)"
                  options={[
                    { value: '', label: 'Sin definir' },
                    ...CONTRIBUTION_FREQUENCIES,
                  ]}
                  value={form.contributionFrequency}
                  onChange={(e) => setForm((f) => ({ ...f, contributionFrequency: e.target.value }))}
                />
                <CurrencyInput
                  label="Monto por aporte (opcional)"
                  placeholder="0"
                  value={form.plannedContribution}
                  onChange={(v) => setForm((f) => ({ ...f, plannedContribution: v }))}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Detail Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {(detailGoal || detailLoading) && (
          <motion.div
            className="fixed inset-0 z-modal flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />
            <motion.div
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-surface-card shadow-lg border border-border-primary"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              {detailLoading && !detailGoal ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : detailGoal ? (
                <>
                  {/* Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-primary bg-surface-card px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        detailGoal.type === 'DEBT'
                          ? 'bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
                          : 'bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light'
                      }`}>
                        {detailGoal.type === 'DEBT' ? <HiCreditCard className="h-5 w-5" /> : <HiBanknotes className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-text-primary truncate">{detailGoal.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={getStatusBadge(detailGoal.status).variant}>
                            {getStatusBadge(detailGoal.status).label}
                          </Badge>
                          <Badge variant={getTypeInfo(detailGoal.type).variant}>
                            {getTypeInfo(detailGoal.type).label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={closeDetail}
                      className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                    >
                      <HiXMark className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="px-6 py-5 space-y-6">
                    {/* Progress section */}
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-sm text-text-secondary">Progreso total</p>
                          <p className="text-3xl font-bold text-text-primary">{detailGoal.progress}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-text-secondary">Pagado</p>
                          <p className="text-lg font-semibold text-text-primary">{formatCurrency(detailGoal.totalPaid)}</p>
                          <p className="text-xs text-text-tertiary">de {formatCurrency(detailGoal.targetAmount)}</p>
                        </div>
                      </div>
                      <ProgressBar value={detailGoal.progress} showLabel={false} size="lg" thresholdColors={false} />
                      <p className="mt-2 text-xs text-text-tertiary">
                        Restante: {formatCurrency(Math.max(0, detailGoal.targetAmount - detailGoal.totalPaid))}
                      </p>
                    </div>

                    {/* Info grid — adapts by type */}
                    {detailGoal.type === 'DEBT' ? (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-surface-secondary p-3">
                          <p className="text-xs text-text-tertiary">Cuota sugerida</p>
                          <p className="mt-1 text-sm font-semibold text-text-primary">
                            {formatCurrency(detailGoal.suggestedInstallment ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-surface-secondary p-3">
                          <p className="text-xs text-text-tertiary">Cuotas</p>
                          <p className="mt-1 text-sm font-semibold text-text-primary">
                            {detailGoal.plannedInstallments ?? 0} meses
                          </p>
                        </div>
                        <div className="rounded-lg bg-surface-secondary p-3">
                          <p className="text-xs text-text-tertiary">Periodo</p>
                          <p className="mt-1 text-sm font-semibold text-text-primary">
                            {getMonthLabel(detailGoal.startMonth).substring(0, 3)} {detailGoal.startYear} - {getMonthLabel(detailGoal.projectedEndMonth).substring(0, 3)} {detailGoal.projectedEndYear}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {detailGoal.contributionFrequency && detailGoal.plannedContribution != null && (
                          <>
                            <div className="rounded-lg bg-surface-secondary p-3">
                              <p className="text-xs text-text-tertiary">Aporte planificado</p>
                              <p className="mt-1 text-sm font-semibold text-text-primary">
                                {formatCurrency(detailGoal.plannedContribution)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-surface-secondary p-3">
                              <p className="text-xs text-text-tertiary">Frecuencia</p>
                              <p className="mt-1 text-sm font-semibold text-text-primary">
                                {getFrequencyLabel(detailGoal.contributionFrequency)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── Projection Insights (SAVINGS goals) ── */}
                    {detailGoal.type === 'SAVINGS' && detailProjection && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <HiChartBar className="h-4 w-4 text-text-secondary" />
                          <h3 className="text-sm font-semibold text-text-primary">Proyecciones</h3>
                          {detailProjection.paceStatus !== 'no_data' && (
                            <Badge variant={
                              detailProjection.paceStatus === 'ahead' ? 'income' :
                              detailProjection.paceStatus === 'behind' ? 'expense' : 'info'
                            }>
                              {detailProjection.paceStatus === 'ahead' ? 'Adelantado' :
                               detailProjection.paceStatus === 'behind' ? 'Atrasado' : 'En ritmo'}
                            </Badge>
                          )}
                        </div>

                        {/* Projection rate cards */}
                        {(detailProjection.netMonthlySavings != null ||
                          detailProjection.plannedMonthlyRate != null ||
                          detailProjection.actualMonthlyRate != null) && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {detailProjection.netMonthlySavings != null && (
                              <div className={`rounded-lg border p-3 ${
                                detailProjection.netMonthlySavings > 0
                                  ? 'border-income/30 bg-income-bg/50 dark:bg-[rgba(5,150,105,0.08)]'
                                  : detailProjection.netMonthlySavings < 0
                                    ? 'border-expense/30 bg-expense-bg/50 dark:bg-[rgba(239,68,68,0.08)]'
                                    : 'border-border-primary'
                              }`}>
                                <p className="text-xs text-text-tertiary">Ahorro neto</p>
                                <p className={`mt-1 text-sm font-semibold ${
                                  detailProjection.netMonthlySavings > 0
                                    ? 'text-income dark:text-income-light'
                                    : detailProjection.netMonthlySavings < 0
                                      ? 'text-expense dark:text-expense-light'
                                      : 'text-text-primary'
                                }`}>
                                  {formatCurrency(detailProjection.netMonthlySavings)}/mes
                                </p>
                                {detailProjection.historicalMonthsRemaining != null && (
                                  <p className="mt-0.5 text-xs text-text-tertiary">
                                    ~{detailProjection.historicalMonthsRemaining} meses restantes
                                  </p>
                                )}
                                {detailProjection.monthsOfData > 0 && (
                                  <p className="mt-0.5 text-xs text-text-tertiary">
                                    {detailProjection.monthsOfData} {detailProjection.monthsOfData === 1 ? 'mes' : 'meses'} de datos
                                  </p>
                                )}
                              </div>
                            )}
                            {detailProjection.plannedMonthlyRate != null && (
                              <div className="rounded-lg border border-border-primary p-3">
                                <p className="text-xs text-text-tertiary">Ritmo planificado</p>
                                <p className="mt-1 text-sm font-semibold text-text-primary">
                                  {formatCurrency(detailProjection.plannedMonthlyRate)}/mes
                                </p>
                                {detailProjection.plannedMonthsRemaining != null && (
                                  <p className="mt-0.5 text-xs text-text-tertiary">
                                    ~{detailProjection.plannedMonthsRemaining} meses restantes
                                  </p>
                                )}
                              </div>
                            )}
                            {detailProjection.actualMonthlyRate != null && (
                              <div className="rounded-lg border border-border-primary p-3">
                                <p className="text-xs text-text-tertiary">Ritmo actual</p>
                                <p className="mt-1 text-sm font-semibold text-text-primary">
                                  {formatCurrency(detailProjection.actualMonthlyRate)}/mes
                                </p>
                                {detailProjection.actualMonthsRemaining != null && (
                                  <p className="mt-0.5 text-xs text-text-tertiary">
                                    ~{detailProjection.actualMonthsRemaining} meses restantes
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Balance & commitments info row */}
                        {(detailProjection.availableBalance > 0 || detailProjection.totalGoalCommitments > 0) && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {detailProjection.availableBalance > 0 && (
                              <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20 p-3">
                                <p className="text-xs text-text-tertiary">Saldo disponible</p>
                                <p className="mt-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
                                  {formatCurrency(detailProjection.availableBalance)}
                                </p>
                              </div>
                            )}
                            {detailProjection.totalGoalCommitments > 0 && (
                              <div className={`rounded-lg border p-3 ${
                                detailProjection.isOvercommitted
                                  ? 'border-warning-dark/30 bg-warning-bg dark:bg-[rgba(245,158,11,0.08)]'
                                  : 'border-border-primary'
                              }`}>
                                <p className="text-xs text-text-tertiary">Compromisos otras metas</p>
                                <p className={`mt-1 text-sm font-semibold ${
                                  detailProjection.isOvercommitted
                                    ? 'text-warning-dark dark:text-warning-light'
                                    : 'text-text-primary'
                                }`}>
                                  {formatCurrency(detailProjection.totalGoalCommitments)}/mes
                                  {detailProjection.isOvercommitted && (
                                    <span className="ml-1 text-xs font-normal text-warning-dark dark:text-warning-light">
                                      (excede ahorro)
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Insight messages */}
                        <div className={`rounded-lg p-3 space-y-2 ${getPaceBg(detailProjection.paceStatus)}`}>
                          {detailProjection.insightMessages.map((msg, idx) => (
                            <p key={idx} className={`text-sm ${getPaceColor(detailProjection.paceStatus)}`}>
                              {msg}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailGoal.description && (
                      <div className="rounded-lg bg-surface-secondary p-3">
                        <p className="text-xs text-text-tertiary mb-1">Descripcion</p>
                        <p className="text-sm text-text-primary">{detailGoal.description}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {detailGoal.status === 'ACTIVE' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          icon={<HiLink className="h-4 w-4" />}
                          onClick={() => openLinkModal(detailGoal.id)}
                        >
                          Vincular transaccion
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<HiPencil className="h-4 w-4" />}
                          onClick={() => {
                            closeDetail();
                            openEdit(detailGoal);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<HiXCircle className="h-4 w-4" />}
                          onClick={() => setCancelId(detailGoal.id)}
                          className="!text-expense hover:!bg-expense-bg"
                        >
                          Cancelar meta
                        </Button>
                      </div>
                    )}

                    {/* Linked Transactions */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-text-primary">
                        Transacciones vinculadas ({detailGoal.transactions?.length ?? 0})
                      </h3>
                      {(!detailGoal.transactions || detailGoal.transactions.length === 0) ? (
                        <p className="text-sm text-text-tertiary py-4 text-center">
                          No hay transacciones vinculadas aun
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {detailGoal.transactions.map((tx: any) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between rounded-lg border border-border-primary p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-text-primary truncate">
                                  {tx.description || tx.category?.name || 'Transaccion'}
                                </p>
                                <p className="text-xs text-text-tertiary">
                                  {new Date(tx.date).toLocaleDateString('es-CO')}
                                  {tx.account && ` · ${tx.account.name}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-semibold text-text-primary">
                                  {formatCurrency(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount))}
                                </span>
                                {detailGoal.status === 'ACTIVE' && (
                                  <button
                                    onClick={() => handleUnlink(detailGoal.id, tx.id)}
                                    className="rounded-lg p-1 text-text-tertiary hover:bg-expense-bg hover:text-expense transition-colors"
                                    aria-label="Desvincular"
                                  >
                                    <HiTrash className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Link Transaction Modal ──────────────────────────────── */}
      <Modal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Vincular transaccion"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLinkModalOpen(false)} disabled={linking}>
              Cancelar
            </Button>
            <Button onClick={handleLink} loading={linking}>
              Vincular
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Ingresa el ID de la transaccion que deseas vincular a esta meta.
            Puedes encontrar el ID en el detalle de cada transaccion.
          </p>
          <Input
            label="ID de transaccion"
            placeholder="ej: clxyz..."
            value={linkTransactionId}
            onChange={(e) => setLinkTransactionId(e.target.value)}
          />
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Tip: Tambien puedes vincular transacciones directamente al crearlas, seleccionando la meta en el formulario de transacciones.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Cancel Confirmation ──────────────────────────────────── */}
      <ConfirmDialog
        isOpen={cancelId !== null}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancelar Meta"
        message="Estas seguro de que deseas cancelar esta meta? Las transacciones vinculadas seguiran existiendo pero ya no estaran asociadas al seguimiento."
        confirmLabel="Cancelar Meta"
        loading={cancelling}
      />
    </div>
  );
}
