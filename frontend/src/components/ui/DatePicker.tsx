import { type InputHTMLAttributes, type Ref } from 'react';

interface DatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

function DatePicker({ label, error, id, className = '', ref, ...rest }: DatePickerProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type="date"
        id={inputId}
        className={`
          input dark:[color-scheme:dark]
          ${error ? 'input-error' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default DatePicker;
