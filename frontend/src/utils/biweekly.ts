export type BiweeklyMode = 'calendar' | 'custom';

export interface BiweeklyRange {
  start: Date;
  end: Date;
  label: string;
}

export interface BiweeklyRanges {
  q1: BiweeklyRange;
  q2: BiweeklyRange;
}

const SHORT_MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function lastDayOfMonth(year: number, monthOneBased: number): number {
  return new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();
}

function clampDay(day: number, year: number, monthOneBased: number): number {
  const last = lastDayOfMonth(year, monthOneBased);
  return Math.min(Math.max(1, day), last);
}

function utcStart(year: number, monthOneBased: number, day: number): Date {
  return new Date(Date.UTC(year, monthOneBased - 1, day, 0, 0, 0, 0));
}

function utcEnd(year: number, monthOneBased: number, day: number): Date {
  return new Date(Date.UTC(year, monthOneBased - 1, day, 23, 59, 59, 999));
}

function previousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

function formatDayMonth(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = SHORT_MONTHS[date.getUTCMonth()];
  return `${day} ${month}`;
}

function buildLabel(start: Date, end: Date): string {
  return `${formatDayMonth(start)} – ${formatDayMonth(end)}`;
}

export function computeBiweeklyRanges(
  month: number,
  year: number,
  mode: BiweeklyMode,
  day1: number | null,
  day2: number | null,
): BiweeklyRanges {
  const useCustom =
    mode === 'custom' &&
    day1 != null &&
    day2 != null &&
    day1 !== day2 &&
    day1 >= 1 &&
    day1 <= 31 &&
    day2 >= 1 &&
    day2 <= 31;

  if (!useCustom) {
    const lastDay = lastDayOfMonth(year, month);
    const q1Start = utcStart(year, month, 1);
    const q1End = utcEnd(year, month, 15);
    const q2Start = utcStart(year, month, 16);
    const q2End = utcEnd(year, month, lastDay);
    return {
      q1: { start: q1Start, end: q1End, label: buildLabel(q1Start, q1End) },
      q2: { start: q2Start, end: q2End, label: buildLabel(q2Start, q2End) },
    };
  }

  if ((day1 as number) < (day2 as number)) {
    const d1 = day1 as number;
    const d2 = day2 as number;
    const lastDay = lastDayOfMonth(year, month);
    const q1Start = utcStart(year, month, clampDay(d1, year, month));
    const q1End = utcEnd(year, month, clampDay(d2 - 1, year, month));
    const q2Start = utcStart(year, month, clampDay(d2, year, month));
    const q2End = utcEnd(year, month, lastDay);
    return {
      q1: { start: q1Start, end: q1End, label: buildLabel(q1Start, q1End) },
      q2: { start: q2Start, end: q2End, label: buildLabel(q2Start, q2End) },
    };
  }

  const d1 = day1 as number;
  const d2 = day2 as number;
  const prev = previousMonth(month, year);
  const q1Start = utcStart(prev.year, prev.month, clampDay(d1, prev.year, prev.month));
  const q1End = utcEnd(year, month, clampDay(d2 - 1, year, month));
  const q2Start = utcStart(year, month, clampDay(d2, year, month));
  const q2End = utcEnd(year, month, clampDay(d1 - 1, year, month));
  return {
    q1: { start: q1Start, end: q1End, label: buildLabel(q1Start, q1End) },
    q2: { start: q2Start, end: q2End, label: buildLabel(q2Start, q2End) },
  };
}
