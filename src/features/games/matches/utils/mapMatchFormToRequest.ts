// src/features/games/utils/mapMatchFormToRequest.ts

import { MatchFormData, GameMode } from "../types/MatchForm";
import { MatchPlayerDto } from "../types/MatchPlayer";

export interface CreateMatchRequest {
  gameId: string;
  gameName: string;

  /** Se preenchido, match pertence a uma sessão de jogo */
  gameSessionId?: string;

  /** Se preenchido, match pertence a uma sessão de campanha */
  campaignSessionId?: string;

  matchDate: string;
  winnerId?: string;
  isSoloGame: boolean;
  durationInMinutes?: number;
  location?: string;
  scoreSummary?: string;

  /** Apenas IDs, sem duplicados */
  playerIds: string[];

  gameMode?: GameMode;
  expansions?: { bggId: number; name: string }[];

  // ── Diário de partida ──────────────────────────────────────────────────
  /** Avaliação pessoal (0–10). */
  personalRating?: number;

  /** Notas livres sobre a partida. */
  notes?: string;

  /** Tags separadas por vírgula. */
  tags?: string;

  /** Justificação para modo não oficial (não conta para rankings). */
  unofficialModeJustification?: string;
}

function uniq(ids: string[]) {
  return Array.from(new Set(ids));
}

function normalizeId(v?: string | null) {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

function extractPlayerIds(players: MatchPlayerDto[] | undefined): string[] {
  if (!players?.length) return [];
  const ids = players
    .map((p) => normalizeId(p.userId))
    .filter((x): x is string => !!x);
  return uniq(ids);
}

function inferWinnerId(form: MatchFormData): string | undefined {
  if (form.isSoloGame) return undefined;

  const direct = normalizeId(form.winnerId);
  if (direct) return direct;

  const inferred = form.players?.find((p) => p.isWinner)?.userId;
  return normalizeId(inferred) ?? undefined;
}

/**
 * Converte o modelo da UI (MatchFormData) num payload de API.
 * - Extrai playerIds de players[]
 * - Infere winnerId por isWinner se não vier direto
 * - Garante winnerId ∈ playerIds (quando existe)
 * - Mapeia sessionId → gameSessionId
 * - Inclui campos de diário (personalRating, notes, tags)
 * - Inclui justificação de modo não oficial
 */
export function mapMatchFormToRequest(form: MatchFormData): CreateMatchRequest {
  const playerIds = extractPlayerIds(form.players);
  const winnerId = inferWinnerId(form);

  const finalPlayerIds =
    winnerId && !playerIds.includes(winnerId)
      ? uniq([...playerIds, winnerId])
      : playerIds;

  return {
    gameId: form.gameId,
    gameName: form.gameName,

    gameSessionId: normalizeId(form.sessionId) ?? undefined,
    campaignSessionId: normalizeId(form.campaignId) ?? undefined,

    matchDate: form.matchDate,
    winnerId,

    isSoloGame: form.isSoloGame,
    durationInMinutes: form.durationInMinutes,
    location: form.location?.trim() || undefined,
    scoreSummary: form.scoreSummary?.trim() || undefined,

    playerIds: finalPlayerIds,

    gameMode: form.gameMode,
    expansions: form.expansions,

    // ── Diário ─────────────────────────────────────────────────────────
    personalRating: form.personalRating,
    notes: form.notes?.trim() || undefined,
    tags: form.tags?.trim() || undefined,

    // ── Modo não oficial ────────────────────────────────────────────────
    unofficialModeJustification: form.unofficialModeJustification?.trim() || undefined,
  };
}