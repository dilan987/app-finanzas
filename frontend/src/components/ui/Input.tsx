import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, id, className = '', ...rest }, ref) => {
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
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900
              placeholder-gray-400 transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-0
              dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500
              ${icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-400'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/30 dark:border-gray-600 dark:focus:border-blue-400'
              }
              disabled:cursor-not-allowed disabled:opacity-50
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...rest}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
