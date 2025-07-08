// src/features/games/types/MatchPlayer.ts
/**
 * Represents a single player's data within a match.
 * Used when submitting match results.
 */
export interface MatchPlayerDto {
  userId: string;
  userName?: string;     // Optional, useful for display only
  score?: number;        // Optional, depending on game
  isWinner: boolean;     // Must be true for at least one player
  rankPosition?: number; // 1 = first, 2 = second, etc.
}
