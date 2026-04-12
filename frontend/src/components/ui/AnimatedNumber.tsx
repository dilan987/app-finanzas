import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
  className?: string;
}

export default function AnimatedNumber({
  value,
  duration = 1000,
  formatFn,
  className = '',
}: AnimatedNumberProps) {
  const animated = useAnimatedNumber(value, { duration });
  const display = formatFn ? formatFn(animated) : Math.round(animated).toLocaleString();

  return <span className={className}>{display}</span>;
}
