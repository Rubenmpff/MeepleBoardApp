/**
 * Represents a board game or expansion.
 */
export interface Game {
  /** Unique internal ID (UUID or database ID) */
  id: string;

  /** Game title */
  name: string;

  /** Optional description or summary */
  description?: string;

  /** Optional cover image URL */
  imageUrl?: string;

  /** Year of original publication */
  yearPublished?: number;

  /** Whether this game is an expansion */
  isExpansion?: boolean;

  /** BoardGameGeek ID (if linked) */
  bggId?: number;

  /** BGG ranking */
  bggRanking?: number;

  /** BGG community average rating */
  averageRating?: number;

  /** Rating interno do MeepleBoard (0-100), calculado a partir da média das avaliações pessoais (diário) de todas as partidas deste jogo. Null se ainda não houver avaliações. */
  meepleBoardScore?: number | null;
  /** Ratings and distinct people behind the MeepleBoard rating (official matches, one per experience). */
  meepleBoardRatingsCount?: number;
  meepleBoardRaters?: number;
  /** Position in the MeepleBoard ranking (equal means share it); only in ranking responses. */
  meepleBoardRank?: number | null;

  /** Nº de pessoas que avaliaram no BGG — medida de "quão conhecido" o jogo é. */
  ratingsCount?: number;

  /** O mesmo número como a API o devolve no detalhe do jogo (UsersRatedCount). */
  usersRatedCount?: number;

  /** Só vem preenchido na resposta do ranking pessoal — a tua própria média para este jogo. */
  personalAverageRating?: number | null;

  /** Complexity (weight) from BGG, 1–5. */
  averageWeight?: number | null;

  /** Play time in minutes and minimum age, as BGG gives them; null when BGG has no value. */
  minPlayTime?: number | null;
  maxPlayTime?: number | null;
  minAge?: number | null;

  // ─── Player count & game modes ────────────────────────────────────────────

  /** Minimum number of players */
  minPlayers?: number;

  /** Maximum number of players */
  maxPlayers?: number;

  /** Whether the game supports solo play (minPlayers === 1) */
  supportsSoloMode?: boolean;

  /**
   * Whether the game is cooperative.
   * Determined by the "Cooperative Game" mechanic on BGG.
   */
  isCooperative?: boolean;
  /** Detetado no BGG (mecânica Legacy/Campaign, ou categoria "Campaign Games"). */
  supportsCampaign?: boolean;

  // ─────────────────────────────────────────────────────────────────────────

  /** Optional list of categories (e.g. strategy, party) */
  categories?: string[];

  /** ID of the base game (if this is an expansion) */
  baseGameId?: string | null;

  /** BGG ID of the base game (used when baseGameId is not available) */
  baseGameBggId?: number | null;

  /** Optional list of expansions (if this is a base game) */
  expansions?: Game[];
}