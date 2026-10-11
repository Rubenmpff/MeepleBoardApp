import { Period, Query } from '../types';

export function formatDuration(minutes: number, language: string): string {
 const hours = Math.floor(minutes / 60);
 const remainder = minutes % 60;
 const number = (n: number) => new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(n);
 return hours ? `${number(hours)} h${remainder ? ` ${number(remainder)} min` : ''}` : `${number(minutes)} min`;
}

export function formatPeriodLabel(period: Period, query: Query, language: string, full = false): string {
 const date = (iso: string) => new Date(`${iso}T12:00:00Z`);
 const start = date(query.start);
 const end = date(query.endExclusive);
 end.setUTCDate(end.getUTCDate() - 1);
 const format = (value: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(language, { ...options, timeZone: 'UTC' }).format(value);
 if (period === 'year') return format(start, { year: 'numeric' });
 if (period === 'month') return format(start, { month: 'long', year: 'numeric' });
 const compact = (value: Date) => language.startsWith('pt')
  ? `${value.getUTCDate()} ${format(value, { month: 'short' })} ${value.getUTCFullYear()}`
  : format(value, { day: 'numeric', month: 'short', year: 'numeric' });
 const label = (value: Date) => full ? format(value, { day: 'numeric', month: 'long', year: 'numeric' }) : compact(value);
 return `${label(start)} – ${label(end)}`;
}

// Bucket keys are YYYY-MM or YYYY-MM-DD; labels never shift across time zones.
export function formatBucket(key: string, language: string): string {
 const [year, month, day] = key.split('-').map(Number);
 return new Intl.DateTimeFormat(language, day ? { dateStyle: 'long', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, (month || 1) - 1, day || 1)));
}
