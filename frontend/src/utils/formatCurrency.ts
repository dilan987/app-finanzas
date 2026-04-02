const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const cached = formatters.get(currency);
  if (cached) return cached;

  const locale = currency === 'COP' ? 'es-CO' : currency === 'EUR' ? 'es-ES' : 'en-US';

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'COP' ? 0 : 2,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  });

  formatters.set(currency, formatter);
  return formatter;
}

export function formatCurrency(amount: number, currency: string = 'COP'): string {
  return getFormatter(currency).format(amount);
}

export function formatCompactCurrency(amount: number, currency: string = 'COP'): string {
  const locale = currency === 'COP' ? 'es-CO' : currency === 'EUR' ? 'es-ES' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}
