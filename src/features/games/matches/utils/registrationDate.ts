/** Local calendar fields, never a UTC string slice or the session's clock time. */
export function withLocalDay(current: Date, day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(),
    current.getHours(), current.getMinutes(), current.getSeconds(), current.getMilliseconds());
}

export function withLocalTime(current: Date, time: Date): Date {
  return new Date(current.getFullYear(), current.getMonth(), current.getDate(),
    time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
}

export function initialSessionMatchDate(session: { scheduledStartDate?: string | null; startDate?: string | null }, current: Date): Date {
  // startDate is historically creation time; prefer the scheduled session day.
  for (const raw of [session.scheduledStartDate, session.startDate]) {
    if (!raw) continue;
    const day = new Date(raw);
    if (Number.isFinite(day.getTime())) return withLocalDay(current, day);
  }
  return current;
}
