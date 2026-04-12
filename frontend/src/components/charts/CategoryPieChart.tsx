import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';

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

const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#ef4444',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
];

function getColor(item: PieDataItem, index: number): string {
  return item.color || CHART_COLORS[index % CHART_COLORS.length] || '#6B7280';
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
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={3}
          dataKey="value"
          animationDuration={500}
          animationEasing="ease-out"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getColor(entry, index)}
              strokeWidth={0}
            />
          ))}
        </Pie>

        {centerLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-sm font-semibold"
            style={{ fill: 'var(--text-primary)' }}
          >
            {centerLabel}
          </text>
        )}

        <Tooltip content={<ChartTooltip />} />

        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: 8 }}
          formatter={(value: string) => (
            <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
