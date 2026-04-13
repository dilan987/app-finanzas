import { useState, useEffect, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { HiArrowTrendingUp, HiArrowTrendingDown, HiArrowsRightLeft } from 'react-icons/hi2';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { categoriesApi } from '../../api/categories.api';
import { accountsApi } from '../../api/accounts.api';
import { PAYMENT_METHODS } from '../../utils/constants';
import { toISODateString } from '../../utils/formatDate';
import type {
  Category,
  Account,
  TransactionType,
  PaymentMethod,
  CreateTransactionData,
} from '../../types';

interface TransactionFormProps {
  initialData?: {
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
    categoryId: string | null;
    accountId?: string | null;
    transferAccountId?: string | null;
  };
  onSubmit: (data: CreateTransactionData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

interface FormErrors {
  amount?: string;
  description?: string;
  date?: string;
  categoryId?: string;
  accountId?: string;
  transferAccountId?: string;
}

const CURRENCIES: { value: string; label: string }[] = [
  { value: 'COP', label: 'COP - Peso colombiano' },
  { value: 'USD', label: 'USD - Dolar' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export default function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading = false,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [date, setDate] = useState(initialData?.date ? toISODateString(initialData.date) : toISODateString(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod ?? 'CASH');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [accountId, setAccountId] = useState(initialData?.accountId ?? '');
  const [transferAccountId, setTransferAccountId] = useState(initialData?.transferAccountId ?? '');
  const [_currency, setCurrency] = useState('COP');
  const [errors, setErrors] = useState<FormErrors>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const isTransfer = type === 'TRANSFER';

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, accRes] = await Promise.all([
          categoriesApi.getAll(),
          accountsApi.getAll({ isActive: true }),
        ]);
        setCategories(catRes.data.data);
        setAccounts(accRes.data.data);
      } catch {
        toast.error('Error al cargar los datos');
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Filter categories by type (only for INCOME/EXPENSE)
  const filteredCategories = isTransfer
    ? []
    : categories.filter((c) => c.type === type);

  // Reset category when type changes and current selection doesn't match
  useEffect(() => {
    if (loadingData) return;
    if (isTransfer) {
      setCategoryId('');
      return;
    }
    const valid = filteredCategories.some((c) => c.id === categoryId);
    if (!valid && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0]!.id);
    } else if (!valid) {
      setCategoryId('');
    }
  }, [type, filteredCategories, categoryId, isTransfer, loadingData]);

  function validate(): boolean {
    const next: FormErrors = {};
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      next.amount = 'Ingresa un monto valido mayor a 0';
    }
    if (!isTransfer && !description.trim()) {
      next.description = 'La descripcion es obligatoria';
    }
    if (!date) {
      next.date = 'La fecha es obligatoria';
    }
    if (!isTransfer && !categoryId) {
      next.categoryId = 'Selecciona una categoria';
    }
    if (isTransfer) {
      if (!accountId) next.accountId = 'Selecciona la cuenta origen';
      if (!transferAccountId) next.transferAccountId = 'Selecciona la cuenta destino';
      if (accountId && transferAccountId && accountId === transferAccountId) {
        next.transferAccountId = 'Las cuentas deben ser diferentes';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateTransactionData = {
      type,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      date,
      paymentMethod: isTransfer ? 'TRANSFER' : paymentMethod,
      categoryId: isTransfer ? null : categoryId,
      accountId: accountId || null,
      transferAccountId: isTransfer ? transferAccountId || null : null,
    };

    await onSubmit(data);
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Type Toggle */}
      <div>
        <label className="label font-semibold">Tipo de transaccion</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
              type === 'INCOME'
                ? 'border-income bg-income-bg text-income dark:border-income-light dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light'
                : 'border-border-primary bg-surface-card text-text-tertiary hover:border-border-secondary hover:text-text-secondary'
            }`}
          >
            <HiArrowTrendingUp className="h-5 w-5" />
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
              type === 'EXPENSE'
                ? 'border-expense bg-expense-bg text-expense dark:border-expense-light dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light'
                : 'border-border-primary bg-surface-card text-text-tertiary hover:border-border-secondary hover:text-text-secondary'
            }`}
          >
            <HiArrowTrendingDown className="h-5 w-5" />
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setType('TRANSFER')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
              type === 'TRANSFER'
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-[rgba(59,130,246,0.12)] dark:text-blue-400'
                : 'border-border-primary bg-surface-card text-text-tertiary hover:border-border-secondary hover:text-text-secondary'
            }`}
          >
            <HiArrowsRightLeft className="h-5 w-5" />
            Transferencia
          </button>
        </div>
      </div>

      {/* Amount */}
      <Input
        label="Monto"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
        error={errors.amount}
        icon={<span className="text-base font-semibold">$</span>}
        className="text-lg font-bold"
      />

      {/* Account selector (shown for all types) */}
      {accounts.length > 0 && (
        <div className={`grid grid-cols-1 gap-4 ${isTransfer ? 'sm:grid-cols-2' : ''}`}>
          <Select
            label={isTransfer ? 'Cuenta origen' : 'Cuenta'}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={[{ value: '', label: 'Sin cuenta' }, ...accountOptions]}
            error={errors.accountId}
            disabled={loading}
          />

          {isTransfer && (
            <Select
              label="Cuenta destino"
              value={transferAccountId}
              onChange={(e) => setTransferAccountId(e.target.value)}
              options={[
                { value: '', label: 'Selecciona cuenta' },
                ...accountOptions.filter((a) => a.value !== accountId),
              ]}
              error={errors.transferAccountId}
              disabled={loading}
            />
          )}
        </div>
      )}

      {/* Category & Description (hidden for transfers, category not needed) */}
      {!isTransfer && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Categoria"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={filteredCategories.map((c) => ({
              value: c.id,
              label: c.name,
              icon: c.icon,
            }))}
            placeholder="Selecciona una categoria"
            error={errors.categoryId}
            disabled={loading}
          />

          <Input
            label="Descripcion"
            placeholder="Descripcion de la transaccion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            disabled={loading}
          />
        </div>
      )}

      {isTransfer && (
        <Input
          label="Descripcion (opcional)"
          placeholder="Ej: Transferencia a ahorros"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      )}

      {/* Date & Payment Method */}
      <div className={`grid grid-cols-1 gap-4 ${!isTransfer ? 'sm:grid-cols-2' : ''}`}>
        <DatePicker
          label="Fecha"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          disabled={loading}
        />

        {!isTransfer && (
          <Select
            label="Metodo de pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={PAYMENT_METHODS.map((pm) => ({
              value: pm.value,
              label: pm.label,
            }))}
            disabled={loading}
          />
        )}
      </div>

      {/* Currency */}
      <Select
        label="Moneda"
        value={_currency}
        onChange={(e) => setCurrency(e.target.value)}
        options={CURRENCIES.map((c) => ({
          value: c.value,
          label: c.label,
        }))}
        disabled={loading}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
