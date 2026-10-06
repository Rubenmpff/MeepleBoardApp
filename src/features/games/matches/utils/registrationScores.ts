import { PlayerState } from "../../../users/types/PlayerState";
import { parsePlayerScore } from "../../../users/utils/playerMappers";

export function scoreError(value?: string): "required" | "invalid" | undefined {
  if (!value?.trim()) return "required";
  try { parsePlayerScore(value); return undefined; } catch { return "invalid"; }
}

export function hasCompleteScores(players: PlayerState[], enabled: boolean): boolean {
  return !enabled || (players.length > 0 && players.every(p => !scoreError(p.score)));
}

// Blank becomes a pending minus sign, never an invented numeric zero.
export function toggleScoreSign(value = ""): string {
  const text = value.trim();
  return text.startsWith("-") ? text.slice(1) : "-" + text.replace(/^\+/, "");
}
