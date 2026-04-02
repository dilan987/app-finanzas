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
        <Legend
          wrapperStyle={{ fontSize: '13px' }}
        />
        <Bar dataKey="income" name="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Gastos" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
