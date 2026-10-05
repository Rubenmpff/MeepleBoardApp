// src/features/games/types/CreateMatchRequest.ts

export type GameMode = "SOLO" | "COOPERATIVE" | "COMPETITIVE";

export interface CreateMatchRequest {
  gameId: string;
  gameName: string;

  /** backend: Match.GameSessionId */
  gameSessionId?: string;

  matchDate: string;
  winnerId?: string;

  isSoloGame: boolean;
  durationInMinutes?: number;
  location?: string;
  scoreSummary?: string;

  /** o backend valida regras com isto */
  playerIds: string[];

  gameMode?: GameMode;

  expansions?: {
    bggId: number;
    name: string;
  }[];
}
