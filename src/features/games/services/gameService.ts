// src/features/games/services/gameService.ts
import api from "@/src/services/api";
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";
import type { AxiosRequestConfig } from "axios";

const gameService = {
  /**
   * Retorna detalhes completos de um jogo por ID local.
   */
  getById: async (id: string, config: AxiosRequestConfig = {}): Promise<Game> => {
    const res = await api.get(`/game/${id}`, config);
    return res.data;
  },

  /**
   * Busca jogo localmente por BGG ID.
   */
  getByBggId: async (bggId: number, config: AxiosRequestConfig = {}): Promise<Game | null> => {
    try {
      const res = await api.get(`/game/by-bgg/${bggId}`, config);
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Se não encontrar localmente, importa do BGG e devolve.
   */
  searchOrImportByBggId: async (bggId: number): Promise<Game> => {
    const local = await gameService.getByBggId(bggId);
    if (local) return local;

    const imported = await api.post(`/game/import/${bggId}`);
    return imported.data;
  },

  searchOrImport: async (name: string): Promise<Game> => {
    const res = await api.get("/game/search", { params: { name } });
    return res.data;
  },

  importByBggId: async (bggId: number, config: AxiosRequestConfig = {}): Promise<Game> => {
    const res = await api.post(`/game/import/${bggId}`, null, config);
    return res.data;
  },

  getSuggestions: async (
    query: string,
    offset = 0,
    limit = 10,
    config: AxiosRequestConfig = {}
  ): Promise<GameSuggestion[]> => {
    const res = await api.get("/game/suggestions", {
      params: { query, offset, limit },
      ...config,
    });
    return res.data;
  },

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

  getExpansionsOfBase: async (baseGameId: string, config: AxiosRequestConfig = {}): Promise<GameSuggestion[]> => {
    const res = await api.get(`/game/${baseGameId}/expansion-suggestions`, { ...config });
    return res.data;
  },
};

export default gameService;
