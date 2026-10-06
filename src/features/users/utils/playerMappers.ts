import { MatchPlayerDto } from "@/src/features/games/matches/types/MatchPlayer";
import { PlayerState } from "../types/PlayerState";

/**
 * Transforms the internal PlayerState (used in UI) into the DTO expected by the backend.
 */
export function toMatchPlayerDto(players: PlayerState[]): MatchPlayerDto[] {
  return players.map((p) => ({
    userId: p.id,
    userName: p.username,
    score: parsePlayerScore(p.score),
    isWinner: p.isWinner,
  }));
}

// Signed SQL/.NET int32. Blank remains absent, never zero.
export function parsePlayerScore(value?: string): number | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  if (!/^[+-]?\d+$/.test(text)) throw new Error("A pontuação deve ser um número inteiro entre -2147483648 e 2147483647.");
  const score = Number(text);
  validatePlayerScore(score);
  return score;
}

export function validatePlayerScore(score: number): void {
  if (!Number.isInteger(score) || score < -2147483648 || score > 2147483647) {
    throw new Error("A pontuação deve ser um número inteiro entre -2147483648 e 2147483647.");
  }
}
