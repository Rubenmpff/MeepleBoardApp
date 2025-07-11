// src/features/library/services/libraryService.ts

import api from "@/src/services/api";
import { GameLibraryStatus } from "../types/GameLibraryStatus";

const libraryService = {
  /**
   * Removes a game from the user's library.
   */
  removeGameFromLibrary: async (userId: string, gameId: string): Promise<void> => {
    await api.delete(`/users/${userId}/games/${gameId}`);
  },

  /**
   * Adds a game to the user's library.
   */
  addGameToLibrary: async (
    userId: string,
    gameId: string,
    gameName: string,
    status: GameLibraryStatus,
    pricePaid?: number
  ): Promise<void> => {
    const finalPrice = typeof pricePaid === "number" && !isNaN(pricePaid) ? pricePaid : 0;

    await api.post(`/users/${userId}/games`, {
      gameId,
      gameName,
      status,
      pricePaid: finalPrice,
    });
  },

  /**
 * Updates the status or price of a game in the user's library.
 */
updateGameInLibrary: async (
  userId: string,
  gameId: string,
  status: GameLibraryStatus,
  pricePaid?: number
): Promise<void> => {
  await api.patch(`/users/${userId}/games/${gameId}`, {
    status,
    pricePaid,
  });
},


  /**
   * Fetches the user's game library.
   */
  getUserLibrary: async (userId: string) => {
    const res = await api.get(`/users/${userId}/games`);
    return res.data;
  },
};

export default libraryService;
