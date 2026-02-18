import { MatchFormData } from "../types/MatchForm";

type GameMode = "SOLO" | "COOPERATIVE" | "COMPETITIVE";

export interface CreateMatchRequest {
  gameId: string;
  gameName: string;
  gameSessionId?: string;

  matchDate: string;
  winnerId?: string;

  isSoloGame: boolean;
  durationInMinutes?: number;
  location?: string;
  scoreSummary?: string;

  playerIds: string[];

  gameMode?: GameMode;
  expansions?: { bggId: number; name: string }[];
}

/**
 * Converte o modelo da UI (MatchFormData) num payload de API mais simples.
 * - Extrai playerIds de players[]
 * - Inferir winnerId por isWinner se não vier
 * - Mapeia sessionId -> gameSessionId
 */
export function mapMatchFormToRequest(form: MatchFormData): CreateMatchRequest {
  const playerIds = Array.from(
    new Set((form.players ?? []).map((p) => p.userId).filter(Boolean))
  );

  const inferredWinnerId =
    form.winnerId ?? form.players?.find((p) => p.isWinner)?.userId;

  return {
    gameId: form.gameId,
    gameName: form.gameName,

    gameSessionId: form.sessionId,

    matchDate: form.matchDate,
    winnerId: inferredWinnerId,

    isSoloGame: form.isSoloGame,
    durationInMinutes: form.durationInMinutes,
    location: form.location,
    scoreSummary: form.scoreSummary,

    playerIds,

    gameMode: form.gameMode,
    expansions: form.expansions,
  };
}
