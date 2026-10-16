/**
 * Match duration as entered in the registration (hours + minutes and how it was obtained) and as shown.
 * The answer is required on new matches: a duration above zero (estimate by default, «Medida» when timed)
 * or an explicit «Não sei». Never prefilled from BGG or from the time the form was open.
 */
export type DurationMethod = "Measured" | "Estimated" | "Unknown";

export type DurationDraft = { hours: string; minutes: string; method: DurationMethod | null; confirmed: boolean };

export const emptyDuration: DurationDraft = { hours: "", minutes: "", method: null, confirmed: false };

/** Below 5 minutes or above 6 hours asks for confirmation; the value is never changed. */
export const UNUSUAL_BELOW = 5, UNUSUAL_ABOVE = 6 * 60;

const digits = (value: string) => /^\d{0,3}$/.test(value.trim());

export type DurationCheck =
  | { state: "unanswered" }
  | { state: "invalid"; reason: "minutes" | "zero" | "format" }
  | { state: "unknown" }
  | { state: "value"; minutes: number; method: "Measured" | "Estimated"; unusual: "short" | "long" | null };

export function checkDuration(draft: DurationDraft): DurationCheck {
  if (draft.method === "Unknown") return { state: "unknown" };
  const h = draft.hours.trim(), m = draft.minutes.trim();
  if (!h && !m) return { state: "unanswered" };
  if (!digits(h) || !digits(m)) return { state: "invalid", reason: "format" };
  const hours = Number(h || 0), minutes = Number(m || 0);
  if (minutes > 59) return { state: "invalid", reason: "minutes" };
  const total = hours * 60 + minutes;
  if (total <= 0) return { state: "invalid", reason: "zero" };
  const unusual = total < UNUSUAL_BELOW ? "short" : total > UNUSUAL_ABOVE ? "long" : null;
  return { state: "value", minutes: total, method: draft.method === "Measured" ? "Measured" : "Estimated", unusual };
}

/** Whether the step may continue: a value (confirmed when unusual) or «Não sei». */
export const durationComplete = (draft: DurationDraft) => {
  const c = checkDuration(draft);
  return c.state === "unknown" || (c.state === "value" && (!c.unusual || draft.confirmed));
};

/** What goes to the API. */
export function durationPayload(draft: DurationDraft): { durationInMinutes?: number; durationMethod?: DurationMethod } {
  const c = checkDuration(draft);
  if (c.state === "unknown") return { durationMethod: "Unknown" };
  if (c.state === "value") return { durationInMinutes: c.minutes, durationMethod: c.method };
  return {};
}

/** «1 h 05 min», «48 min», «2 h». */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")} min` : `${h} h`;
}

/**
 * Back to the two fields, e.g. when correcting a recorded duration. An older duration keeps no method
 * («método não indicado»); it becomes an estimate only if the person changes the value.
 */
export function draftFrom(minutes?: number | null, method?: DurationMethod | null): DurationDraft {
  if (method === "Unknown") return { ...emptyDuration, method: "Unknown" };
  if (minutes == null || minutes <= 0) return emptyDuration;
  return { hours: minutes >= 60 ? String(Math.floor(minutes / 60)) : "", minutes: String(minutes % 60).padStart(minutes >= 60 ? 2 : 1, "0"),
    method: method ?? null, confirmed: true };
}
