// src/features/games/types/MatchForm.ts

import { MatchPlayerDto } from "./MatchPlayer";

/** Tipos de modo de jogo suportados */
export type GameMode = "SOLO" | "COOPERATIVE" | "COMPETITIVE";

/**
 * Estrutura utilizada para criar ou editar uma partida
 * (dados enviados do frontend para o backend)
 */
export interface MatchFormData {
  /** ID do jogo principal */
  gameId: string;

  /** Nome do jogo (cache para UI rápida) */
  gameName: string;

  /** ID da sessão associada (opcional para partidas rápidas) */
  sessionId?: string;

  /** Data/hora em que a partida foi jogada */
  matchDate: string;

  /** ID do jogador vencedor (opcional) */
  winnerId?: string;

  /** Indica se é um jogo solo */
  isSoloGame: boolean;

  /** Duração da partida em minutos (opcional) */
  durationInMinutes?: number;

  /** Local onde foi jogada (opcional) */
  location?: string;

  /** Observações ou resumo do resultado (opcional) */
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

/**
 * Estrutura de partida completa retornada pelo backend
 * (inclui ID único e metadados calculados)
 */
export interface MatchDto extends MatchFormData {
  /** ID único da partida (gerado pelo backend) */
  id: string;

  /** Nome do vencedor (opcional) */
  winnerName?: string;
}

/** Representação simplificada da última partida jogada */
export interface LastMatch {
  /** Nome do jogo */
  name: string;

  /** Data em que foi jogado */
  date: string;

  /** Nome do vencedor */
  winner: string;
}
