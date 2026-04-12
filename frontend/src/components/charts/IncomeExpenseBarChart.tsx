import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import ChartTooltip from './ChartTooltip';

interface BarChartDataItem {
  month: string;
  income: number;
  expense: number;
}

interface IncomeExpenseBarChartProps {
  data: BarChartDataItem[];
  height?: number;
}

export default function IncomeExpenseBarChart({
  data,
  height = 350,
}: IncomeExpenseBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-primary)"
          strokeOpacity={0.5}
          vertical={false}
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

        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--border-primary)', fillOpacity: 0.3 }} />

        <Legend
          wrapperStyle={{ fontSize: '13px', color: 'var(--text-secondary)' }}
        />

        <Bar
          dataKey="income"
          name="Ingresos"
          fill="#22c55e"
          radius={[6, 6, 0, 0]}
          animationDuration={500}
          animationEasing="ease-out"
          maxBarSize={48}
        />
        <Bar
          dataKey="expense"
          name="Gastos"
          fill="#ef4444"
          radius={[6, 6, 0, 0]}
          animationDuration={500}
          animationEasing="ease-out"
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
