import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { useUiStore } from '../../store/uiStore';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
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
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={goToPrevious}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        aria-label="Mes anterior"
      >
        <HiChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[160px] text-center text-sm font-medium text-gray-900 dark:text-gray-100">
        {MONTH_NAMES[currentMonth - 1]} {currentYear}
      </span>
      <button
        onClick={goToNext}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        aria-label="Mes siguiente"
      >
        <HiChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
