import { formatCurrency } from '../../utils/formatCurrency';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>;
  label?: string;
  formatValue?: (value: number) => string;
}

export default function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const format = formatValue ?? ((v: number) => formatCurrency(v));

  return (
    <div
      className="rounded-lg border bg-surface-card shadow-lg"
      style={{
        borderColor: 'var(--border-primary)',
        padding: '10px 14px',
        minWidth: 140,
      }}
    >
      {label && (
        <p
          className="mb-1.5 text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </p>
      )}
      <ul className="m-0 list-none space-y-1 p-0">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span
              className="font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {entry.name}
            </span>
            <span
              className="ml-auto font-semibold tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {format(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
