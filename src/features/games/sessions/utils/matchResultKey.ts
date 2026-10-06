import { MatchDto } from "../../matches/types/MatchForm";

// A missing display name is not a missing result. Never infer a draw/team result.
export function matchResultKey(match: Pick<MatchDto, "winnerId" | "winnerName">): string {
  if (!match.winnerId) return "sessions.resultUndefined";
  return match.winnerName?.trim() ? "sessions.winnerNamed" : "sessions.winnerNameUnavailable";
}
