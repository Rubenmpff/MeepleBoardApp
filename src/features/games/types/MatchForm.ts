// src/features/games/types/MatchForm.ts

import { MatchPlayerDto } from "./MatchPlayer";

/** Tipos de modo de jogo suportados */
export type GameMode = "SOLO" | "COOPERATIVE" | "COMPETITIVE";

/* ============================================================
   📥 Modelo usado para ENVIAR dados para o backend
   ============================================================ */
export interface MatchFormData {
  gameId: string;
  gameName: string;

  /** Para match dentro de sessão de jogo */
  sessionId?: string;

  /** Para match dentro de uma campanha */
  campaignId?: string;
  campaignSessionNumber?: number;
  campaignSessionTitle?: string;

  matchDate: string;
  winnerId?: string;
  isSoloGame: boolean;
  durationInMinutes?: number;
  location?: string;
  scoreSummary?: string;
  players: MatchPlayerDto[];
  gameMode?: GameMode;
  expansions?: { bggId: number; name: string }[];

  // ── Diário de partida ──────────────────────────────────────────────────
  /** Avaliação pessoal (0–10). A média dá o rating pessoal do jogo. */
  personalRating?: number;

  /** Notas livres — momentos épicos, estratégias, história. */
  notes?: string;

  /** Tags separadas por vírgula (ex: "épico,reviravolta,campanha"). */
  tags?: string;

  /** Justificação para modo não oficial (não conta para rankings). */
  unofficialModeJustification?: string;
}

/* ============================================================
   📤 Modelo retornado pelo backend (espelha o MatchDto C#)
   ============================================================ */
export interface MatchDto {
  id: string;
  matchDate: string;
  gameId: string;
  gameName: string;
  winnerId?: string;
  winnerName?: string;
  isSoloGame: boolean;
  durationInMinutes?: number;
  location?: string;
  scoreSummary?: string;
  players: MatchPlayerDto[];

  // ── Diário de partida ──────────────────────────────────────────────────
  /** Avaliação pessoal do utilizador (0–10). */
  personalRating?: number | null;

  /** Notas livres sobre a partida. */
  notes?: string | null;

  /** Tags separadas por vírgula. */
  tags?: string | null;

  /** Se true, esta partida não conta para rankings. */
  isOfficialMode?: boolean;

  /** Justificação do modo não oficial. */
  unofficialModeJustification?: string | null;

  // ── Estado do diário ──────────────────────────────────────────────────
  /**
   * Estado do diário desta partida.
   * "Open"   → à espera que todos os jogadores avaliem
   * "Closed" → fechado (manual, automático após 1 dia, ou todos avaliaram)
   */
  journalStatus?: "Open" | "Closed";

  /** Data em que o diário foi fechado. */
  closedAt?: string | null;
}

/* ============================================================
   📌 Última partida
   ============================================================ */
export interface LastMatch {
  name: string;
  date: string;
  winner: string;
}