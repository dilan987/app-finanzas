import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import ChartTooltip from './ChartTooltip';

interface TrendDataItem {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

interface TrendLineChartProps {
  data: TrendDataItem[];
  height?: number;
}

const SERIES = [
  { dataKey: 'income', name: 'Ingresos', color: '#22c55e', id: 'gradIncome' },
  { dataKey: 'expense', name: 'Gastos', color: '#ef4444', id: 'gradExpense' },
  { dataKey: 'savings', name: 'Ahorro', color: '#3b82f6', id: 'gradSavings' },
] as const;

export default function TrendLineChart({ data, height = 350 }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          {SERIES.map((s) => (
            <linearGradient key={s.id} id={s.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-primary)"
          strokeOpacity={0.5}
        />

        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
          axisLine={{ stroke: 'var(--border-primary)' }}
          tickLine={{ stroke: 'var(--border-primary)' }}
        />

        <YAxis
          tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
          axisLine={{ stroke: 'var(--border-primary)' }}
          tickLine={{ stroke: 'var(--border-primary)' }}
          tickFormatter={(v: number) =>
            v >= 1_000_000
              ? `${(v / 1_000_000).toFixed(1)}M`
              : v >= 1_000
                ? `${(v / 1_000).toFixed(0)}K`
                : String(v)
          }
        />

        <Tooltip content={<ChartTooltip />} />

        <Legend
          wrapperStyle={{ fontSize: '13px', color: 'var(--text-secondary)' }}
        />

        {SERIES.map((s) => (
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#${s.id})`}
            fillOpacity={1}
            dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: s.color, strokeWidth: 2, stroke: '#fff' }}
            animationDuration={500}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
