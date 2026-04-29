const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

const SHORT_MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles',
  'Jueves', 'Viernes', 'Sábado',
] as const;

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/** "15 de marzo de 2026" */
export function formatDate(value: string | Date): string {
  const d = toDate(value);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "15/03/2026" */
export function formatShortDate(value: string | Date): string {
  const d = toDate(value);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "15 Mar 2026" */
export function formatMediumDate(value: string | Date): string {
  const d = toDate(value);
  const day = d.getDate();
  const month = SHORT_MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** "Marzo 2026" */
export function formatMonthYear(month: number, year: number): string {
  const name = MONTH_NAMES[month - 1];
  return name ? `${name} ${year}` : `${month}/${year}`;
}

/** Returns the full month name (1-indexed). */
export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

/** Returns the short month name (1-indexed). */
export function getShortMonthName(month: number): string {
  return SHORT_MONTH_NAMES[month - 1] ?? '';
}

/** Returns the day-of-week name. */
export function getDayName(value: string | Date): string {
  const d = toDate(value);
  return DAY_NAMES[d.getDay()] ?? '';
}

/** Relative date: "Hoy", "Ayer", "Hace 3 dias", "Hace 2 semanas", etc. */
export function formatRelativeDate(value: string | Date): string {
  const d = toDate(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'Hace 1 año' : `Hace ${years} años`;
}

/** ISO date string "YYYY-MM-DD" for form inputs (always UTC to avoid timezone shift). */
export function toISODateString(value: string | Date): string {
  const d = toDate(value);
  return d.toISOString().split('T')[0]!;
}

/**
 * Format a date that represents a calendar day (no time component) without
 * applying the local timezone offset. Use this for fields like
 * `nextExecutionDate` of scheduled movements, where the value is stored as
 * UTC midnight but conceptually is "day X" regardless of timezone.
 *
 * "2026-05-01T00:00:00.000Z" → "01/05/2026" (always, in any timezone).
 */
export function formatDateOnly(value: string | Date): string {
  if (typeof value === 'string') {
    const datePart = value.split('T')[0];
    if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, d] = datePart.split('-');
      return `${d}/${m}/${y}`;
    }
  }
  const d = toDate(value);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
