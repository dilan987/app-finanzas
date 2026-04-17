import { type ReactNode, type Ref, useState, useEffect } from 'react';

interface CurrencyInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Input de monto que acepta tanto "." como "," como separador decimal.
 * Internamente almacena el valor con "." para compatibilidad con parseFloat.
 */
function CurrencyInput({
  label,
  error,
  helperText,
  icon,
  placeholder = '0',
  value,
  onChange,
  disabled = false,
  className = '',
  id,
  ref,
}: CurrencyInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  // Display value shows what the user typed (with comma if they used comma)
  const [displayValue, setDisplayValue] = useState(value);

  // Sync display when external value changes (e.g. form reset, edit mode)
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  function handleChange(raw: string) {
    // Allow only digits, one decimal separator (. or ,), and leading minus
    // Replace comma with dot for internal storage
    const cleaned = raw.replace(/,/g, '.');

    // Validate: allow empty, or a valid number pattern
    if (cleaned === '' || cleaned === '-' || /^-?\d*\.?\d*$/.test(cleaned)) {
      setDisplayValue(raw); // Show what user typed (preserves comma)
      onChange(cleaned);    // Store normalized value with dot
    }
  }

  function handleBlur() {
    // On blur, clean up trailing dots and normalize display
    if (displayValue === '' || displayValue === '.' || displayValue === ',') {
      setDisplayValue('');
      onChange('');
      return;
    }
    const normalized = displayValue.replace(/,/g, '.');
    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      // Format to remove trailing zeros but keep decimals if present
      const formatted = String(num);
      setDisplayValue(formatted);
      onChange(formatted);
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-tertiary">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="decimal"
          className={`
            input
            ${icon ? 'pl-10' : ''}
            ${error ? 'input-error' : ''}
            ${className}
          `}
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          autoComplete="off"
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default CurrencyInput;
