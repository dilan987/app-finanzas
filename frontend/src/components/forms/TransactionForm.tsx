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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('INCOME')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
            type === 'INCOME'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
          }`}
        >
          <HiArrowTrendingUp className="h-5 w-5" />
          Ingreso
        </button>
        <button
          type="button"
          onClick={() => setType('EXPENSE')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
            type === 'EXPENSE'
              ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/30 dark:text-red-400'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
          }`}
        >
          <HiArrowTrendingDown className="h-5 w-5" />
          Gasto
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Monto
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-medium text-gray-400">
            $
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className={`block w-full rounded-lg border bg-white py-4 pl-10 pr-4 text-2xl font-bold text-gray-900 placeholder-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-600 ${
              errors.amount
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/30 dark:border-gray-600'
            }`}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p>
        )}
      </div>

      {/* Category */}
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

      {/* Description */}
      <Input
        label="Descripcion"
        placeholder="Descripcion de la transaccion"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        disabled={loading}
      />

      {/* Date */}
      <DatePicker
        label="Fecha"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={errors.date}
        disabled={loading}
      />

      {/* Payment Method */}
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
