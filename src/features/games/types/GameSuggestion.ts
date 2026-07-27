/**
 * GameSuggestion.ts
 *
 * Tipos e helpers para sugestões de jogos do BGG.
 * Inclui lógica de modos de jogo com suporte a expansões
 * e modos não oficiais.
 */

export interface GameSuggestion {
  id?: string;
  bggId: number;
  name: string;
  yearPublished?: number;
  imageUrl?: string;
  isExpansion?: boolean;
  minPlayers?: number;
  maxPlayers?: number;
  supportsSoloMode?: boolean;
  isCooperative?: boolean;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type GameMode = "solo" | "multiplayer" | "cooperative";

export type ModeSource =
  | "bgg_official"      // BGG confirma este modo
  | "expansion"         // Expansão selecionada confirma este modo
  | "unofficial";       // Utilizador forçou — não conta para rankings

export interface ModeInfo {
  available: boolean;
  source: ModeSource | null;
  /** Label para mostrar na UI */
  label: string;
  /** Ícone descritivo */
  icon: string;
}

export interface AvailableModes {
  solo: ModeInfo;
  multiplayer: ModeInfo;
  cooperative: ModeInfo;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type GameLike = {
  minPlayers?: number;
  maxPlayers?: number;
  supportsSoloMode?: boolean;
  isCooperative?: boolean;
};

/**
 * Calcula os modos disponíveis combinando o jogo base com a expansão selecionada.
 *
 * Regras:
 *   Solo        → base.minPlayers===1 OU expansão.minPlayers===1
 *   Cooperativo → base.isCooperative OU expansão.isCooperative
 *   Multiplayer → base.maxPlayers>1 OU expansão.maxPlayers>1
 *
 * Source:
 *   "bgg_official" → jogo base confirma
 *   "expansion"    → só a expansão confirma
 *   null           → não disponível oficialmente
 */
export function getAvailableModes(
  game: GameLike,
  expansion?: GameLike | null
): AvailableModes {
  const baseMin  = game.minPlayers ?? 1;
  const baseMax  = game.maxPlayers ?? 99;
  const baseSolo = game.supportsSoloMode ?? false;
  const baseCoop = game.isCooperative ?? false;

  const expMin  = expansion?.minPlayers;
  const expMax  = expansion?.maxPlayers;
  const expSolo = expansion?.supportsSoloMode ?? false;
  const expCoop = expansion?.isCooperative ?? false;

  // ── Solo ─────────────────────────────────────────────────────────────────
  const soloByBase      = baseSolo || baseMin === 1;
  const soloByExpansion = !soloByBase && (expSolo || (expMin != null && expMin === 1));

  // ── Cooperativo ──────────────────────────────────────────────────────────
  const coopByBase      = baseCoop;
  const coopByExpansion = !coopByBase && expCoop;

  // ── Multiplayer ──────────────────────────────────────────────────────────
  const multiByBase      = baseMax > 1;
  const multiByExpansion = !multiByBase && (expMax != null && expMax > 1);

  return {
    solo: {
      available: soloByBase || soloByExpansion,
      source: soloByBase ? "bgg_official" : soloByExpansion ? "expansion" : null,
      label: "Solo",
      icon: "person",
    },
    multiplayer: {
      available: multiByBase || multiByExpansion,
      source: multiByBase ? "bgg_official" : multiByExpansion ? "expansion" : null,
      label: "Multiplayer",
      icon: "people",
    },
    cooperative: {
      available: coopByBase || coopByExpansion,
      source: coopByBase ? "bgg_official" : coopByExpansion ? "expansion" : null,
      label: "Cooperativo",
      icon: "favorite",
    },
  };
}

/**
 * Verifica se um modo específico é oficial (conta para rankings).
 */
export function isModeOfficial(
  mode: GameMode,
  modes: AvailableModes
): boolean {
  const info = modes[mode];
  return info.available && info.source !== "unofficial";
}

/**
 * Retorna o melhor modo default para um jogo.
 *
 * Prioridade:
 *   1. Só solo possível (maxPlayers === 1)
 *   2. Cooperativo disponível oficialmente
 *   3. Multiplayer
 *   4. Solo (fallback)
 */
export function getDefaultMode(
  game: GameLike,
  expansion?: GameLike | null
): GameMode {
  const modes = getAvailableModes(game, expansion);
  const max = expansion?.maxPlayers ?? game.maxPlayers ?? 99;

  if (modes.solo.available && max === 1) return "solo";
  if (modes.cooperative.available) return "cooperative";
  if (modes.multiplayer.available) return "multiplayer";
  return "solo";
}

/**
 * Retorna descrição legível dos modos disponíveis.
 */
export function getModesDescription(
  game: GameLike,
  expansion?: GameLike | null
): string {
  const modes = getAvailableModes(game, expansion);
  const parts: string[] = [];

  if (modes.solo.available) parts.push("Solo");
  if (modes.cooperative.available) parts.push("Cooperativo");
  if (modes.multiplayer.available) parts.push("Multiplayer");

  return parts.join(" · ") || "—";
}

/**
 * Retorna o label da fonte do modo para mostrar na UI.
 */
export function getModeSourceLabel(source: ModeSource | null): string {
  switch (source) {
    case "bgg_official": return "✅ Oficial BGG";
    case "expansion":    return "📦 Via expansão";
    case "unofficial":   return "⚠️ Não oficial";
    default:             return "";
  }
}