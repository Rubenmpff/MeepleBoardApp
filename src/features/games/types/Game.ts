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

  /** Complexity (weight) from BGG */
  averageWeight?: number;

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