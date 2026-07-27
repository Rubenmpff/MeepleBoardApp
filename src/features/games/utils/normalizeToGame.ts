// src/features/games/utils/normalizeToGame.ts
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";

/**
 * Converte sempre um Game ou GameSuggestion num Game válido.
 * - Se já for um Game da BD local (tem id), devolve-o como está.
 * - Se for apenas uma sugestão, cria um objeto Game mínimo
 *   preservando todos os campos disponíveis incluindo
 *   minPlayers, maxPlayers, supportsSoloMode e isCooperative.
 */
export function normalizeToGame(selected: Game | GameSuggestion): Game {
  // Se já tem um id local, é um Game completo da BD
  if ("id" in selected && selected.id) {
    return {
      ...selected,
      id: String(selected.id),
    } as Game;
  }

  // Converter GameSuggestion num Game mínimo
  const suggestion = selected as GameSuggestion;

  return {
    id: "",                                         // ainda não importado localmente
    name: suggestion.name,
    description: "",
    imageUrl: suggestion.imageUrl ?? "",
    yearPublished: suggestion.yearPublished,
    isExpansion: suggestion.isExpansion ?? false,
    bggId: suggestion.bggId,
    bggRanking: undefined,
    averageRating: undefined,
    averageWeight: undefined,

    // ── Campos de modos de jogo — preservados da sugestão ─────────────────
    minPlayers: suggestion.minPlayers,
    maxPlayers: suggestion.maxPlayers,
    supportsSoloMode: suggestion.supportsSoloMode,
    isCooperative: suggestion.isCooperative,
    // ───────────────────────────────────────────────────────────────────────

    categories: [],
    baseGameId: null,
    baseGameBggId: null,
    expansions: [],
  };
}