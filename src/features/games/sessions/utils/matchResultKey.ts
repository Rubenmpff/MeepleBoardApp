import { MatchDto } from "../../matches/types/MatchForm";

export function matchResultKey(match: Partial<MatchDto>): string {
  if (match.result != null) return match.gameMode === "COOPERATIVE" ? `outcomes.team${match.result}` : `outcomes.${match.result}`;
  if (!match.winnerId && !match.winnerName?.trim()) return "outcomes.legacyUnknown";
  return match.winnerName?.trim() ? "outcomes.legacyWinner" : "sessions.winnerNameUnavailable";
}

export function matchResultText(match: Partial<MatchDto>, t: (key: string, options?: any) => any): string {
  if (match.gameMode === "COMPETITIVE" && (match.result === "Win" || match.result === "Draw")) {
    const ids = match.result === "Win" ? match.winnerIds ?? [] : (match.players ?? []).filter(p => p.outcome === "Draw").map(p => p.userId);
    const names = ids.map(id => match.players?.find(p => p.userId === id)?.userName?.trim() || t(match.result === "Win" ? "sessions.winnerNameUnavailable" : "sessions.playerNameUnavailable"));
    if (!names.length) return `${t(`outcomes.${match.result}`)} · ${t("sessions.winnerNameUnavailable")}`;
    return t(match.result === "Win" ? "outcomes.winnersNamed" : "outcomes.tiedNamed", { name: names.join(", ") });
  }
  return t(matchResultKey(match), { name: match.winnerName });
}
