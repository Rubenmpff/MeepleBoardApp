// Shared formatting so dates, times and ratings read the same on every screen.
export const locale = (language: string) => (language.startsWith("pt") ? "pt-PT" : language.startsWith("en") ? "en-GB" : language);

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

/** "7 out. 2026" — day, short month and year. */
export function formatDate(value: string | Date, language: string): string {
  // Composed explicitly: some engines render { month: "short" } with a year as "7/10/2026".
  const date = toDate(value);
  const month = new Intl.DateTimeFormat(locale(language), { month: "short" }).format(date);
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
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
