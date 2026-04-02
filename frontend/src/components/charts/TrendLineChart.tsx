import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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

export default function TrendLineChart({ data, height = 350 }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
          tickFormatter={(v: number) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            borderColor: 'var(--tooltip-border, #e5e7eb)',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          formatter={(value: number) => [
            new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: '13px' }} />
        <Line
          type="monotone"
          dataKey="income"
          name="Ingresos"
          stroke="#059669"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Gastos"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="savings"
          name="Ahorro"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
