// src/features/library/types/UserGameLibrary.ts

import { Game } from "../../games/catalog/types/Game";
import { GameLibraryStatus } from "./GameLibraryStatus";

/**
 * Represents a single entry of a user's library.
 * Always includes a BGG ID returned from backend.
 */
export interface UserGameLibrary {
  /** Unique ID of the library entry (UUID from backend) */
  id: string;

  /** Local DB game ID (GUID) */
  gameId: string;

  /** BoardGameGeek ID (always present) */
  bggId: number;

  /** Game name */
  gameName: string;

  /** Game image URL (optional, fallback to placeholder) */
  gameImageUrl?: string;

  /** Game library status (Owned, Wishlist, Played, etc.) */
  status: GameLibraryStatus;

  /** ISO date when added to library */
  addedAt: string;

  /** Last played date (ISO) */
  lastPlayedAt?: string;

  /** Number of times the game was played */
  totalTimesPlayed?: number;

  /** Total accumulated play hours */
  totalHoursPlayed?: number;

  /** Price paid for the game (optional) */
  pricePaid?: number;

  /** Optional richer Game object for UI rendering */
  game?: Game;

    minPlayers?: number;
  maxPlayers?: number;
  averageRating?: number;
  isCooperative?: boolean;
  supportsSoloMode?: boolean;
  isExpansion?: boolean;
}

/** Um jogo que já jogaste (partidas reais), esteja ou não na biblioteca hoje. */
export interface PlayedGame {
  gameId: string;
  gameName: string;
  gameImageUrl?: string;
  averageRating?: number;
  minPlayers?: number;
  maxPlayers?: number;
  isExpansion?: boolean;
  isCooperative?: boolean;
  supportsSoloMode?: boolean;
  timesPlayed: number;
  lastPlayedAt?: string;
  inLibrary: boolean;
  status?: GameLibraryStatus;
  pricePaid?: number;
}