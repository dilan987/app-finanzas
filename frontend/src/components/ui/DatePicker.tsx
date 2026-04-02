import { forwardRef, type InputHTMLAttributes } from 'react';

interface DatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, id, className = '', ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          id={inputId}
          className={`
            block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0
            dark:bg-gray-800 dark:text-gray-100
            dark:[color-scheme:dark]
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-400'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/30 dark:border-gray-600 dark:focus:border-blue-400'
            }
            disabled:cursor-not-allowed disabled:opacity-50
            ${className}
          `}
          aria-invalid={error ? 'true' : undefined}
          {...rest}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
