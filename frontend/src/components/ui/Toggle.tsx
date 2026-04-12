interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
}

const sizeConfig = {
  sm: { track: 'w-8 h-[18px]', thumb: 'h-3.5 w-3.5', translate: 'translate-x-[14px]' },
  md: { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'translate-x-5' },
};

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  label,
}: ToggleProps) {
  const config = sizeConfig[size];

  return (
    <label className={`inline-flex cursor-pointer items-center gap-2.5 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2
          ${config.track}
          ${checked ? 'bg-primary-600' : 'bg-surface-tertiary'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block transform rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out
            ${config.thumb}
            ${checked ? config.translate : 'translate-x-0.5'}
            mt-[1px]
          `}
        />
      </button>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  );
}
