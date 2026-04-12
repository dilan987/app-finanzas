import { useState, useEffect, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { HiArrowTrendingUp, HiArrowTrendingDown } from 'react-icons/hi2';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { categoriesApi } from '../../api/categories.api';
import { PAYMENT_METHODS } from '../../utils/constants';
import { toISODateString } from '../../utils/formatDate';
import type {
  Category,
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
    categoryId: string;
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
  const [_currency, setCurrency] = useState('COP');
  const [errors, setErrors] = useState<FormErrors>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await categoriesApi.getAll();
        setCategories(res.data.data);
      } catch {
        toast.error('Error al cargar las categorias');
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Reset category when type changes and current selection doesn't match
  useEffect(() => {
    const valid = filteredCategories.some((c) => c.id === categoryId);
    if (!valid && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0]!.id);
    } else if (!valid) {
      setCategoryId('');
    }
  }, [type, filteredCategories, categoryId]);

  function validate(): boolean {
    const next: FormErrors = {};
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      next.amount = 'Ingresa un monto valido mayor a 0';
    }
    if (!description.trim()) {
      next.description = 'La descripcion es obligatoria';
    }
    if (!date) {
      next.date = 'La fecha es obligatoria';
    }
    if (!categoryId) {
      next.categoryId = 'Selecciona una categoria';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      date,
      paymentMethod,
      categoryId,
    });
  }

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

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

      {/* Category & Description */}
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

      {/* Date & Payment Method */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          label="Fecha"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          disabled={loading}
        />

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
