import { MatchPlayerDto } from "./MatchPlayer";

/** Game mode types supported */
export type GameMode = "SOLO" | "COOPERATIVE" | "COMPETITIVE";

/** Match submission payload */
export interface MatchFormData {
  gameId: string;
  gameName: string;
  matchDate: string;

  winnerId?: string;
  isSoloGame: boolean;
  durationInMinutes?: number;
  location?: string;
  scoreSummary?: string;

  players: MatchPlayerDto[];
  gameMode?: GameMode; // optional for now

  expansions?: {
    bggId: number;
    name: string;
  }[];
}

/** Lightweight representation of the last match played */
export interface LastMatch {
  name: string;
  date: string;
  winner: string;
}
