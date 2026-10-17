// Shared formatting so dates, times and ratings read the same on every screen.
export const locale = (language: string) => (language.startsWith("pt") ? "pt-PT" : language.startsWith("en") ? "en-GB" : language);

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

// Each part on its own: some engines render { month: "short" } together with a year as "7/10/2026".
const part = (date: Date, language: string, options: Intl.DateTimeFormatOptions, timeZone?: string) =>
  new Intl.DateTimeFormat(locale(language), { ...options, ...(timeZone ? { timeZone } : {}) }).format(date);

/** "7 out. 2026" / "7 Oct 2026" — day, short month and year; in a given time zone when the screen has one. */
export function formatDate(value: string | Date, language: string, timeZone?: string): string {
  const date = toDate(value);
  const month = part(date, language, { month: "short" }, timeZone);
  if (!timeZone) return `${date.getDate()} ${month} ${date.getFullYear()}`;
  return `${part(date, language, { day: "numeric" }, timeZone)} ${month} ${part(date, language, { year: "numeric" }, timeZone)}`;
}

/** "7 out." / "7 Oct" — day and short month, for lists where the year is known. */
export function formatDayMonth(value: string | Date, language: string): string {
  const date = toDate(value);
  return `${date.getDate()} ${part(date, language, { month: "short" })}`;
}

/** "outubro de 2026" / "October 2026" (long) or "out. 2026" / "Oct 2026" (short). */
export function formatMonthYear(value: string | Date, language: string, style: "long" | "short" = "long", timeZone?: string): string {
  const date = toDate(value);
  if (style === "long") return part(date, language, { month: "long", year: "numeric" }, timeZone);
  return `${part(date, language, { month: "short" }, timeZone)} ${part(date, language, { year: "numeric" }, timeZone)}`;
}

/** "48 min", "2 h", "1 h 05 min" — the same in every screen; numbers follow the language (e.g. "1234 h" / "1,234 h"). */
export function formatDuration(minutes: number, language: string): string {
  const number = (n: number) => new Intl.NumberFormat(locale(language)).format(n);
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  if (!hours) return `${number(rest)} min`;
  return rest ? `${number(hours)} h ${String(rest).padStart(2, "0")} min` : `${number(hours)} h`;
}

/** "qua., 7 out. · 09:49" — for sessions and matches where the time matters. */
export function formatDateTime(value: string | Date, language: string): string {
  const date = toDate(value);
  const weekday = new Intl.DateTimeFormat(locale(language), { weekday: "short" }).format(date);
  const month = new Intl.DateTimeFormat(locale(language), { month: "short" }).format(date);
  const day = `${weekday} ${date.getDate()} ${month}`;
  const time = new Intl.DateTimeFormat(locale(language), { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

/** "7,5" — ratings and scores on a 0–10 scale, one decimal. */
export function formatRating(value: number, language: string): string {
  return new Intl.NumberFormat(locale(language), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}
