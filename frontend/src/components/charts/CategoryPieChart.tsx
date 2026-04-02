import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  data: PieDataItem[];
  height?: number;
  centerLabel?: string;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: CustomLabelProps) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs text-gray-600 dark:text-gray-400"
      fontSize={11}
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
}

export default function CategoryPieChart({
  data,
  height = 350,
  centerLabel,
}: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={renderCustomLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        {centerLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-900 text-sm font-semibold dark:fill-gray-100"
          >
            {centerLabel}
          </text>
        )}
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
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value: string) => (
            <span className="text-gray-700 dark:text-gray-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
