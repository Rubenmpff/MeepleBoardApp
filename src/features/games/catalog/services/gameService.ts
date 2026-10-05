// src/features/games/catalog/services/gameService.ts

import api from "@/src/services/api";
import type { AxiosRequestConfig } from "axios";

import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  pageIndex: number;
  totalPages: number;
}

export type SearchSortOption =
  | "relevance"
  | "most_known"
  | "bgg_rating"
  | "year_desc"
  | "name_asc";

export type SearchSuggestionOptions = {
  isExpansion?: boolean;
  playerCount?: number;
  minBggRating?: number;
  sort?: SearchSortOption;
};

function buildSuggestionParams(
  query: string,
  offset: number,
  limit: number,
  options: SearchSuggestionOptions = {}
) {
  return {
    query,
    offset,
    limit,
    ...(options.isExpansion != null
      ? { isExpansion: options.isExpansion }
      : {}),
    ...(options.playerCount != null
      ? { playerCount: options.playerCount }
      : {}),
    ...(options.minBggRating != null
      ? { minBggRating: options.minBggRating }
      : {}),
    sort: options.sort ?? "relevance",
  };
}

/*
 * Single-flight global para pesquisas.
 *
 * Mesmo que duas instâncias do ecrã/hook tentem pedir exatamente a mesma
 * página ao mesmo tempo (algo que pode acontecer em Development), só sai
 * um pedido HTTP real para a API. Os restantes reutilizam a Promise.
 */
const inFlightSuggestionRequests =
  new Map<string, Promise<GameSuggestion[]>>();

function buildInFlightKey(
  endpoint: string,
  query: string,
  offset: number,
  limit: number,
  options: SearchSuggestionOptions
): string {
  return JSON.stringify({
    endpoint,
    query: query.trim().toLowerCase(),
    offset,
    limit,
    isExpansion: options.isExpansion ?? null,
    playerCount: options.playerCount ?? null,
    minBggRating: options.minBggRating ?? null,
    sort: options.sort ?? "relevance",
  });
}

async function getSuggestionsSingleFlight(
  endpoint: string,
  query: string,
  offset: number,
  limit: number,
  config: AxiosRequestConfig,
  options: SearchSuggestionOptions
): Promise<GameSuggestion[]> {
  const key = buildInFlightKey(
    endpoint,
    query,
    offset,
    limit,
    options
  );

  const existing =
    inFlightSuggestionRequests.get(key);

  if (existing) {
    return existing;
  }

  const request = api
    .get(endpoint, {
      ...config,
      params: {
        ...(config.params ?? {}),
        ...buildSuggestionParams(
          query,
          offset,
          limit,
          options
        ),
      },
    })
    .then((res) =>
      Array.isArray(res.data)
        ? (res.data as GameSuggestion[])
        : []
    )
    .finally(() => {
      if (
        inFlightSuggestionRequests.get(key) ===
        request
      ) {
        inFlightSuggestionRequests.delete(key);
      }
    });

  inFlightSuggestionRequests.set(
    key,
    request
  );

  return request;
}

const gameService = {
  /**
   * Retorna detalhes completos de um jogo por ID local.
   */
  getById: async (
    id: string,
    config: AxiosRequestConfig = {}
  ): Promise<Game> => {
    const res = await api.get(
      `/game/${id}`,
      config
    );

    return res.data;
  },

  /**
   * Busca jogo localmente por BGG ID.
   */
  getByBggId: async (
    bggId: number,
    config: AxiosRequestConfig = {}
  ): Promise<Game | null> => {
    try {
      const res = await api.get(
        `/game/by-bgg/${bggId}`,
        config
      );

      return res.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Se não encontrar localmente, importa do BGG e devolve.
   */
  searchOrImportByBggId: async (
    bggId: number
  ): Promise<Game> => {
    const local =
      await gameService.getByBggId(
        bggId
      );

    if (local) {
      return local;
    }

    const imported =
      await api.post(
        `/game/import/${bggId}`
      );

    return imported.data;
  },

  searchOrImport: async (
    name: string
  ): Promise<Game> => {
    const res = await api.get(
      "/game/search",
      {
        params: { name },
      }
    );

    return res.data;
  },

  importByBggId: async (
    bggId: number,
    config: AxiosRequestConfig = {}
  ): Promise<Game> => {
    const res = await api.post(
      `/game/import/${bggId}`,
      null,
      config
    );

    return res.data;
  },

  /**
   * Jogos em destaque no BGG.
   */
  getHotGames: async (
    config: AxiosRequestConfig = {}
  ): Promise<Game[]> => {
    const res = await api.get(
      "/BGG/hot",
      config
    );

    return res.data ?? [];
  },

  /**
   * Pesquisa geral: jogos base + expansões.
   */
  getSuggestions: async (
    query: string,
    offset = 0,
    limit = 10,
    config: AxiosRequestConfig = {},
    options: SearchSuggestionOptions = {}
  ): Promise<GameSuggestion[]> =>
    getSuggestionsSingleFlight(
      "/game/suggestions",
      query,
      offset,
      limit,
      config,
      options
    ),

  /**
   * Pesquisa apenas jogos base.
   */
  getBaseGameSuggestions: async (
    query: string,
    offset = 0,
    limit = 10,
    config: AxiosRequestConfig = {},
    options: Omit<
      SearchSuggestionOptions,
      "isExpansion"
    > = {}
  ): Promise<GameSuggestion[]> =>
    getSuggestionsSingleFlight(
      "/game/base-search",
      query,
      offset,
      limit,
      config,
      {
        ...options,
        isExpansion: false,
      }
    ),

  /**
   * Pesquisa apenas expansões.
   */
  getExpansionSuggestions: async (
    query: string,
    offset = 0,
    limit = 10,
    config: AxiosRequestConfig = {},
    options: Omit<
      SearchSuggestionOptions,
      "isExpansion"
    > = {}
  ): Promise<GameSuggestion[]> =>
    getSuggestionsSingleFlight(
      "/game/expansion-suggestions",
      query,
      offset,
      limit,
      config,
      {
        ...options,
        isExpansion: true,
      }
    ),

  getExpansionsOfBase: async (
    baseGameId: string,
    config: AxiosRequestConfig = {}
  ): Promise<GameSuggestion[]> => {
    const res = await api.get(
      `/game/${baseGameId}/expansion-suggestions`,
      config
    );

    return Array.isArray(res.data)
      ? res.data
      : [];
  },

  /**
   * Ranking de jogos ordenado pela fonte escolhida.
   */
  getRankings: async (
    pageIndex = 0,
    pageSize = 20,
    source:
      | "meepleboard"
      | "bgg" = "meepleboard",
    config: AxiosRequestConfig = {}
  ): Promise<PagedResponse<Game>> => {
    const res = await api.get(
      "/game/rankings",
      {
        ...config,
        params: {
          ...(config.params ?? {}),
          pageIndex,
          pageSize,
          source,
        },
      }
    );

    return res.data;
  },

  /**
   * Ranking pessoal.
   */
  getMyRankings: async (
    pageIndex = 0,
    pageSize = 20,
    config: AxiosRequestConfig = {}
  ): Promise<PagedResponse<Game>> => {
    const res = await api.get(
      "/game/rankings/mine",
      {
        ...config,
        params: {
          ...(config.params ?? {}),
          pageIndex,
          pageSize,
        },
      }
    );

    return res.data;
  },
};

export default gameService;
