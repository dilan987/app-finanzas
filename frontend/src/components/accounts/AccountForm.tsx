import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import CurrencyInput from '../ui/CurrencyInput';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '../../utils/constants';
import type { Account, CreateAccountData, UpdateAccountData } from '../../types';

interface AccountFormProps {
  account?: Account | null;
  onSubmit: (data: CreateAccountData | UpdateAccountData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function AccountForm({ account, onSubmit, onCancel, loading }: AccountFormProps) {
  const isEditing = !!account;

  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState(account?.type ?? 'CHECKING');
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance?.toString() ?? '0');
  const [institutionName, setInstitutionName] = useState(account?.institutionName ?? '');
  const [color, setColor] = useState(account?.color ?? '#3B82F6');
  const [includeInBudget, setIncludeInBudget] = useState(account?.includeInBudget ?? true);
  const [includeInTotal, setIncludeInTotal] = useState(account?.includeInTotal ?? true);
  const [notes, setNotes] = useState(account?.notes ?? '');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setInitialBalance(account.initialBalance.toString());
      setInstitutionName(account.institutionName ?? '');
      setColor(account.color);
      setIncludeInBudget(account.includeInBudget);
      setIncludeInTotal(account.includeInTotal);
      setNotes(account.notes ?? '');
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      const data: UpdateAccountData = {
        name,
        type,
        institutionName: institutionName || null,
        color,
        includeInBudget,
        includeInTotal,
        notes: notes || null,
      };
      await onSubmit(data);
    } else {
      const data: CreateAccountData = {
        name,
        type,
        initialBalance: parseFloat(initialBalance) || 0,
        institutionName: institutionName || null,
        color,
        includeInBudget,
        includeInTotal,
        notes: notes || null,
      };
      await onSubmit(data);
    }
  };

  const typeOptions = ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre de la cuenta"
        placeholder="Ej: Bancolombia Ahorros"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Select
        label="Tipo de cuenta"
        options={typeOptions}
        value={type}
        onChange={(e) => setType(e.target.value as any)}
      />

      {!isEditing && (
        <CurrencyInput
          label="Saldo inicial"
          value={initialBalance}
          onChange={setInitialBalance}
          helperText="El saldo actual de la cuenta al momento de registrarla"
        />
      )}

      <Input
        label="Institucion financiera"
        placeholder="Ej: Bancolombia, Nequi, Davivienda"
        value={institutionName}
        onChange={(e) => setInstitutionName(e.target.value)}
      />

      {/* Color picker */}
      <div>
        <label className="label">Color</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-lg transition-all ${
                color === c ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-card' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border-primary bg-surface-secondary p-4">
        <div>
          <Toggle
            label="Incluir en presupuesto"
            checked={includeInBudget}
            onChange={setIncludeInBudget}
          />
          <p className="mt-1 ml-[52px] text-xs text-text-tertiary">
            Las transacciones de esta cuenta se cuentan en el presupuesto mensual
          </p>
        </div>
        <div>
          <Toggle
            label="Incluir en patrimonio"
            checked={includeInTotal}
            onChange={setIncludeInTotal}
          />
          <p className="mt-1 ml-[52px] text-xs text-text-tertiary">
            El saldo de esta cuenta se suma al patrimonio neto
          </p>
        </div>
      </div>

      <Input
        label="Notas"
        placeholder="Notas opcionales sobre esta cuenta"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={!name.trim()}>
          {isEditing ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  );
}
