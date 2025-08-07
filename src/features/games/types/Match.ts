// src/features/games/types/Match.ts

import { MatchPlayerDto } from "./MatchPlayer";

/** Tipos de modo de jogo suportados */
export type GameMode = "SOLO" | "COOPERATIVE" | "COMPETITIVE";

/** Representa uma partida registada no sistema */
export interface Match {
  /** Identificador único da partida */
  id: string;

  /** Jogo principal */
  gameId: string;
  gameName: string;

  /** Sessão associada (opcional, para partidas rápidas pode não existir) */
  sessionId?: string;

  /** Data/hora em que a partida foi jogada */
  matchDate: string;

  /** Jogador vencedor (opcional se for jogo solo) */
  winnerId?: string;
  winnerName?: string;

  /** Flag se a partida foi jogada solo */
  isSoloGame: boolean;

  /** Duração total em minutos (opcional) */
  durationInMinutes?: number;

  /** Localização (opcional) */
  location?: string;

  /** Resumo ou observações sobre a pontuação (opcional) */
  scoreSummary?: string;

  /** Jogadores participantes */
  players: MatchPlayerDto[];

  /** Tipo de modo de jogo (opcional) */
  gameMode?: GameMode;

  /** Expansões utilizadas (opcional) */
  expansions?: {
    bggId: number;
    name: string;
  }[];
}
