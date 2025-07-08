import { MatchPlayerDto } from "@/src/features/games/types/MatchPlayer";
import { PlayerState } from "../types/PlayerState";

/**
 * Transforms the internal PlayerState (used in UI) into the DTO expected by the backend.
 */
export function toMatchPlayerDto(players: PlayerState[]): MatchPlayerDto[] {
  return players.map((p) => ({
    userId: p.id,
    userName: p.username,
    score: p.score ? Number(p.score) : undefined, // Convert score string to number (if any)
    isWinner: p.isWinner,
  }));
}
