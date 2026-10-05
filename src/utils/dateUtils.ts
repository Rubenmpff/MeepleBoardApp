// src/utils/dateUtils.ts
//
// Utilitários de data timezone-safe.
// Garante que todas as datas enviadas ao backend são UTC,
// independentemente do país ou fuso horário do utilizador.

/**
 * Devolve a data atual em formato ISO 8601 UTC.
 * Usar sempre em vez de new Date().toISOString() para clareza de intenção.
 *
 * @example
 * matchDate: nowUtc()  // "2026-07-28T16:32:00.000Z"
 */
export function nowUtc(): string {
  return new Date().toISOString(); // toISOString() sempre devolve UTC com sufixo Z
}

/**
 * Converte qualquer data para string UTC para enviar ao backend.
 * Funciona com Date, string ISO, ou timestamp numérico.
 *
 * @example
 * toUtcString(new Date())           // "2026-07-28T16:32:00.000Z"
 * toUtcString("2026-07-28T17:32:00") // converte de local para UTC
 */
export function toUtcString(date: Date | string | number): string {
  return new Date(date).toISOString();
}

/**
 * Formata uma data UTC recebida do backend para mostrar ao utilizador
 * no seu fuso horário local.
 *
 * @example
 * formatLocalDate("2026-07-28T16:32:00.000Z", "pt-PT")
 * // "28 de julho de 2026" (em Portugal, UTC+1 → mostra como 28 jul 17:32)
 */
export function formatLocalDate(
  utcString: string,
  locale: string = "pt-PT",
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(utcString).toLocaleDateString(locale, options ?? {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formata data + hora UTC no fuso do utilizador.
 */
export function formatLocalDateTime(
  utcString: string,
  locale: string = "pt-PT"
): string {
  return new Date(utcString).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}