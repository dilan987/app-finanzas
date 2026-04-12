import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { useUiStore } from '../../store/uiStore';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface MonthSelectorProps {
  className?: string;
}

export default function MonthSelector({ className = '' }: MonthSelectorProps) {
  const { currentMonth, currentYear, setMonth, setYear } = useUiStore();

  const goToPrevious = () => {
    if (currentMonth === 1) {
      setMonth(12);
      setYear(currentYear - 1);
    } else {
      setMonth(currentMonth - 1);
    }
  };

  const goToNext = () => {
    if (currentMonth === 12) {
      setMonth(1);
      setYear(currentYear + 1);
    } else {
      setMonth(currentMonth + 1);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        onClick={goToPrevious}
        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
        aria-label="Mes anterior"
      >
        <HiChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[160px] text-center text-sm font-semibold text-text-primary">
        {MONTH_NAMES[currentMonth - 1]} {currentYear}
      </span>
      <button
        onClick={goToNext}
        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
        aria-label="Mes siguiente"
      >
        <HiChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
