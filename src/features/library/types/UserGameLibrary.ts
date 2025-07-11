// src/features/library/types/UserGameLibrary.ts

import { Game } from "../../games/types/Game";
import { GameLibraryStatus } from "./GameLibraryStatus";

/**
 * Represents a user's library entry for a game.
 * Some fields are optional and may be calculated or updated later.
 */
export interface UserGameLibrary {
  id: string;                   // Unique ID of the entry (possibly UUID from backend)
  bggId?: number;

  // 🔹 Basic game info
  gameId: string;               // Game ID (linked to catalog or BGG)
  gameName: string;            // Game name
  gameImageUrl?: string;       // Game image (from BGG or local cache)
  

  // 🔹 Library status
  status: GameLibraryStatus;   // e.g., Owned, Wishlist, Played...

  // 🔹 Additional data
  addedAt: string;             // Date added — can come from the API or be generated locally
  lastPlayedAt?: string;       // Last played (ISO string) — optional
  totalTimesPlayed?: number;   // Number of times the game was played
  totalHoursPlayed?: number;   // Total hours played (accumulated)
  pricePaid?: number;          // Price paid (manually entered or imported)

  game?: Game; // only populated when needed for richer UI rendering
}
