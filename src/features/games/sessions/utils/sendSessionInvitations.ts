import { GameSession } from "../types/GameSession";

export type InvitationResult = { userId: string; status: "sent" | "alreadyInvited" | "failed"; reason?: "friendship" | "unavailable" };
export async function sendSessionInvitations(sessionId: string, selected: string[], organizerId: string,
  read: (id: string) => Promise<GameSession>, send: (id: string, userId: string) => Promise<void>) {
  const ids = [...new Set(selected)];
  const results: InvitationResult[] = [];
  let session: GameSession;
  // Never retry blindly after an ambiguous network failure: first obtain current membership.
  try { session = await read(sessionId); } catch { return { results: ids.map(userId => ({ userId, status: "failed" as const })), session: null, refreshFailed: true }; }
  if (session.organizerId !== organizerId || session.status !== "Upcoming")
    return { results: ids.map(userId => ({ userId, status: "failed" as const })), session, refreshFailed: false };
  for (const userId of ids) {
    if (session.players.some(p => p.userId === userId)) { results.push({ userId, status: "alreadyInvited" }); continue; }
    try { await send(sessionId, userId); results.push({ userId, status: "sent" }); }
    catch (error: any) {
      const status = error?.response?.status;
      results.push({ userId, status: "failed", ...(status === 400 ? { reason: "friendship" as const } : status === 403 || status === 404 || status === 409 ? { reason: "unavailable" as const } : {}) });
    }
  }
  let refreshFailed = false;
  try {
    session = await read(sessionId);
    for (const result of results) {
      if (result.status === "failed" && session.players.some(p => p.userId === result.userId)) {
        result.status = "alreadyInvited"; delete result.reason;
      }
    }
  } catch { refreshFailed = true; }
  return { results, session, refreshFailed };
}
