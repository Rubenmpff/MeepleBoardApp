// src/features/library/services/libraryService.ts

import api from "@/src/services/api";
import { GameLibraryStatus } from "../types/GameLibraryStatus";

const BASE_PATH = "/users";

const libraryService = {
  /**
   * Removes a game from the user's library.
   */
  async removeGameFromLibrary(userId: string, gameId: string): Promise<void> {
    if (!userId || !gameId) throw new Error("Invalid userId or gameId");
    await api.delete(`${BASE_PATH}/${userId}/games/${gameId}`);
  },

  /**
   * Adds a game to the user's library.
   */
  async addGameToLibrary(
    userId: string,
    gameId: string,
    gameName: string,
    status: GameLibraryStatus,
    pricePaid: number = 0
  ): Promise<void> {
    if (!userId || !gameId || !gameName) throw new Error("Missing required parameters");

    await api.post(`${BASE_PATH}/${userId}/games`, {
      gameId,
      gameName,
      status,
      pricePaid: isNaN(pricePaid) ? 0 : pricePaid,
    });
  },

  /**
   * Updates the status or price of a game in the user's library.
   */
  async updateGameInLibrary(
    userId: string,
    gameId: string,
    status: GameLibraryStatus,
    pricePaid?: number
  ): Promise<void> {
    if (!userId || !gameId) throw new Error("Invalid userId or gameId");

    await api.patch(`${BASE_PATH}/${userId}/games/${gameId}`, {
      status,
      pricePaid,
    });
  },

  /**
   * Fetches the user's game library.
   */
  async getUserLibrary(userId: string) {
    if (!userId) throw new Error("Invalid userId");

    const { data } = await api.get(`${BASE_PATH}/${userId}/games`);
    return data;
  },
};

export default libraryService;
