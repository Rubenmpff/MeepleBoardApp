import api from "@/src/services/api";
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";
import type { AxiosRequestConfig } from "axios";

const gameService = {
  /**
   * Searches for a game by name. If not found locally, it falls back to BGG.
   */
  searchOrImport: async (name: string): Promise<Game> => {
    const res = await api.get("/game/search", {
      params: { name },
    });
    return res.data;
  },

  /**
   * Returns quick game suggestions from local + BGG sources.
   */
  getSuggestions: async (
    query: string,
    offset = 0,
    limit = 10,
    config: AxiosRequestConfig = {} // ← novo parâmetro
  ): Promise<GameSuggestion[]> => {
    const res = await api.get("/game/suggestions", {
      params: { query, offset, limit },
      ...config, // ← aqui vai o { signal }
    });
    return res.data;
  },

  /**
   * Returns suggestions for base games (with fallback to BGG).
   */
  getBaseGameSuggestions: async (
    query: string,
    offset = 0,
    limit = 10,
    config: AxiosRequestConfig = {}
  ): Promise<GameSuggestion[]> => {
    const res = await api.get("/game/base-search", {
      params: { query, offset, limit },
      ...config,
    });
    return res.data;
  },

  /**
   * Returns suggestions for expansions based on search query.
   */
  getExpansionSuggestions: async (
    query: string,
    offset = 0,
    limit = 10,
    config: AxiosRequestConfig = {}
  ): Promise<GameSuggestion[]> => {
    const res = await api.get("/game/expansion-suggestions", {
      params: { query, offset, limit },
      ...config,
    });
    return res.data;
  },

  /**
   * Returns expansions for a specific base game by its ID.
   */
  getExpansionsOfBase: async (
    baseGameId: string,
    config: AxiosRequestConfig = {}
  ): Promise<GameSuggestion[]> => {
    const res = await api.get(`/game/${baseGameId}/expansion-suggestions`, {
      ...config,
    });
    return res.data;
  },
};

export default gameService;
