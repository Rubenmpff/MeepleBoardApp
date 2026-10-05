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

// Matches the existing backend int? Score rules; blank means no score.
export function parsePlayerScore(value?: string): number | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  const score = Number(text);
  validatePlayerScore(score);
  return score;
}

export function validatePlayerScore(score: number): void {
  if (!Number.isInteger(score) || score < 0 || score > 2147483647) {
    throw new Error("A pontuação deve ser um número inteiro entre 0 e 2147483647. O modelo atual não aceita pontuações negativas.");
  }
}
