// src/features/games/utils/normalizeToGame.ts
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";

/**
 * Converte sempre um Game ou GameSuggestion num Game válido.
 * - Se já for um Game da BD local, devolve-o como está.
 * - Se for apenas uma sugestão, cria um objeto Game mínimo.
 */
export function normalizeToGame(selected: Game | GameSuggestion): Game {
  // Se já tem um id local, assumimos que é um Game completo
  if ("id" in selected && selected.id) {
    return {
      ...selected,
      id: String(selected.id),
    } as Game;
  }

  // Converter GameSuggestion num Game mínimo
  const suggestion = selected as GameSuggestion;

  return {
    id: "", // ainda não importado localmente
    name: suggestion.name,
    description: "",
    imageUrl: suggestion.imageUrl ?? "",
    yearPublished: suggestion.yearPublished,
    isExpansion: (suggestion as any).isExpansion ?? false,
    bggId: suggestion.bggId,
    bggRanking: undefined,
    averageRating: undefined,
    averageWeight: undefined,
    minPlayers: undefined,
    maxPlayers: undefined,
    supportsSoloMode: undefined,
    categories: [],
    baseGameId: null,
    baseGameBggId: null,
    expansions: [],
  };
}
