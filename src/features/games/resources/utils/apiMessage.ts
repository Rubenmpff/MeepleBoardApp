/** The API's own message when it explains a refusal (duplicate link, invalid address…). */
export function apiMessage(error: unknown): string | null {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === "string" && message ? message : null;
}
