// src/features/games/catalog/hooks/useGameSuggestions.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import gameService, {
  type SearchSortOption,
} from "../services/gameService";
import searchResultsCache from "../services/searchResultsCache";
import type { Game } from "../types/Game";
import { normalizeToGame } from "../utils/normalizeToGame";

type SuggestionScope = "base" | "all";

export type UseGameSuggestionsOptions = {
  isExpansion?: boolean;
  playerCount?: number;
  minBggRating?: number;
  sort?: SearchSortOption;
};

const PAGE_SIZE = 10;
const MIN_CATALOG_QUERY_LENGTH = 2;

type QueryCacheEntry = {
  data: Game[];
  offset: number;
  hasMore: boolean;
};

function buildRequestKey(
  query: string,
  scope: SuggestionScope,
  options: UseGameSuggestionsOptions
): string {
  return JSON.stringify({
    query,
    scope,
    isExpansion:
      options.isExpansion ?? null,
    playerCount:
      options.playerCount ?? null,
    minBggRating:
      options.minBggRating ?? null,
    sort:
      options.sort ?? "relevance",
  });
}

function buildPersistentCacheKey(
  query: string,
  scope: SuggestionScope,
  options: UseGameSuggestionsOptions
): string {
  const parts = [
    query,
    `scope=${scope}`,
    `expansion=${
      options.isExpansion == null
        ? "all"
        : options.isExpansion
          ? "true"
          : "false"
    }`,
    `players=${
      options.playerCount ?? "all"
    }`,
    `rating=${
      options.minBggRating ?? "all"
    }`,
    `sort=${
      options.sort ?? "relevance"
    }`,
  ];

  return parts.join("|");
}

export const useGameSuggestions = (
  scope: SuggestionScope = "all",
  options: UseGameSuggestionsOptions = {}
) => {
  const [suggestions, setSuggestions] =
    useState<Game[]>([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [hasMore, setHasMore] =
    useState(true);

  const suggestionsRef =
    useRef<Game[]>([]);

  const cacheRef =
    useRef<Map<string, QueryCacheEntry>>(
      new Map()
    );

  const requestIdRef =
    useRef(0);

  const abortControllerRef =
    useRef<AbortController | null>(
      null
    );

  const lastRequestKeyRef =
    useRef("");

  /*
   * Chave do pedido que está efetivamente em voo.
   *
   * É diferente de lastRequestKeyRef:
   * - lastRequestKeyRef representa o último pedido concluído com sucesso;
   * - activeRequestKeyRef representa o pedido que está a decorrer agora.
   *
   * Isto impede o FlatList/onEndReached de iniciar outra página enquanto
   * a primeira página da mesma pesquisa ainda não terminou.
   */
  const activeRequestKeyRef =
    useRef("");

  const loadingRef =
    useRef(false);

  const normalizedOptions =
    useMemo<UseGameSuggestionsOptions>(
      () => ({
        isExpansion:
          options.isExpansion,
        playerCount:
          options.playerCount,
        minBggRating:
          options.minBggRating,
        sort:
          options.sort ?? "relevance",
      }),
      [
        options.isExpansion,
        options.playerCount,
        options.minBggRating,
        options.sort,
      ]
    );

  const setSuggestionsSync =
    useCallback((data: Game[]) => {
      suggestionsRef.current = data;
      setSuggestions(data);
    }, []);

  const setLoadingSync =
    useCallback((value: boolean) => {
      loadingRef.current = value;
      setLoading(value);
    }, []);

  const reset =
    useCallback(() => {
      /*
       * Invalida imediatamente qualquer resposta antiga.
       */
      requestIdRef.current += 1;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      setSuggestionsSync([]);
      setHasMore(true);
      setError(null);
      setLoadingSync(false);

      lastRequestKeyRef.current = "";
      activeRequestKeyRef.current = "";
    }, [
      setLoadingSync,
      setSuggestionsSync,
    ]);

  /*
   * Se filtros, tipo ou ordenação mudarem,
   * a pesquisa anterior deixa de ser válida.
   *
   * A próxima chamada a fetchSuggestions será tratada como pesquisa nova,
   * começando sempre no offset 0.
   */
  useEffect(() => {
    reset();
  }, [
    scope,
    normalizedOptions,
    reset,
  ]);

  const fetchSuggestions =
    useCallback(
      async (
        query: string,
        forceReload = false
      ) => {
        const normalized =
          query.trim().toLowerCase();

        if (
          normalized.length <
          MIN_CATALOG_QUERY_LENGTH
        ) {
          reset();
          return;
        }

        const requestKey =
          buildRequestKey(
            normalized,
            scope,
            normalizedOptions
          );

        const persistentCacheKey =
          buildPersistentCacheKey(
            normalized,
            scope,
            normalizedOptions
          );

        const isNewRequest =
          requestKey !==
          lastRequestKeyRef.current;

        const memoryCache =
          cacheRef.current.get(
            requestKey
          );

        /*
         * Evita pedidos duplicados da MESMA pesquisa enquanto um pedido
         * ainda está em voo.
         *
         * O FlatList pode chamar onEndReached imediatamente quando os
         * primeiros 10 itens ainda não enchem o ecrã. Antes desta proteção,
         * esse segundo pedido podia considerar a pesquisa "nova" porque
         * lastRequestKeyRef só é preenchido quando a primeira resposta chega.
         *
         * Resultado antigo:
         *   página 1 começa
         *   -> onEndReached dispara
         *   -> página 1 é abortada
         *   -> outra página 1 começa
         *   -> Axios/React Native pode reportar "Network Error"
         *
         * Agora, enquanto a mesma requestKey estiver ativa, simplesmente
         * ignoramos qualquer pedido duplicado dessa mesma configuração.
         */
        if (
          loadingRef.current &&
          activeRequestKeyRef.current ===
            requestKey
        ) {
          /*
           * Já existe um pedido desta mesma pesquisa/configuração em voo.
           *
           * Ignoramos também forceReload aqui. Isto é intencional:
           * - evita dois offset=0 simultâneos;
           * - impede pull-to-refresh/refresh de capas de cancelar paginação;
           * - um refresh explícito continua a funcionar normalmente assim
           *   que o pedido atual terminar.
           */
          return;
        }

        /*
         * Pesquisa diferente (ou refresh explícito):
         * cancela o pedido anterior, porque já deixou de ser relevante.
         */
        abortControllerRef.current?.abort();

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        const myRequestId =
          ++requestIdRef.current;

        activeRequestKeyRef.current =
          requestKey;

        const freshRequest =
          forceReload ||
          isNewRequest ||
          !memoryCache;

        if (freshRequest) {
          setHasMore(true);
        }

        const currentOffset =
          freshRequest
            ? 0
            : memoryCache?.offset ??
              suggestionsRef.current.length;

        setLoadingSync(true);
        setError(null);

        /*
         * Cache persistente só é usada para a primeira página.
         *
         * A chave inclui filtros + sort + scope para impedir que resultados
         * de uma configuração apareçam noutra.
         */
        if (freshRequest) {
          const persistedCache =
            await searchResultsCache.get(
              persistentCacheKey
            );

          if (
            persistedCache &&
            persistedCache.length > 0 &&
            myRequestId ===
              requestIdRef.current
          ) {
            setSuggestionsSync(
              persistedCache
            );
          }
        }

        try {
          const requestOptions = {
            isExpansion:
              normalizedOptions.isExpansion,
            playerCount:
              normalizedOptions.playerCount,
            minBggRating:
              normalizedOptions.minBggRating,
            sort:
              normalizedOptions.sort ??
              "relevance",
          };

          const raw =
            scope === "base"
              ? await gameService.getBaseGameSuggestions(
                  normalized,
                  currentOffset,
                  PAGE_SIZE,
                  {
                    signal:
                      controller.signal,
                  },
                  {
                    playerCount:
                      requestOptions.playerCount,
                    minBggRating:
                      requestOptions.minBggRating,
                    sort:
                      requestOptions.sort,
                  }
                )
              : await gameService.getSuggestions(
                  normalized,
                  currentOffset,
                  PAGE_SIZE,
                  {
                    signal:
                      controller.signal,
                  },
                  requestOptions
                );

          if (
            myRequestId !==
            requestIdRef.current
          ) {
            return;
          }

          const incoming: Game[] =
            Array.isArray(raw)
              ? raw.map(normalizeToGame)
              : raw
                ? [
                    normalizeToGame(
                      raw as any
                    ),
                  ]
                : [];

          const existing =
            freshRequest
              ? []
              : suggestionsRef.current;

          const uniqueGames =
            new Map<string, Game>();

          [
            ...existing,
            ...incoming,
          ].forEach(
            (game, index) => {
              const key =
                game.bggId
                  ? `bgg-${game.bggId}`
                  : game.id
                    ? `id-${game.id}`
                    : `fallback-${
                        currentOffset +
                        index
                      }-${game.name}`;

              uniqueGames.set(
                key,
                game
              );
            }
          );

          const nextData =
            Array.from(
              uniqueGames.values()
            );

          const reachedEnd =
            incoming.length <
            PAGE_SIZE;

          cacheRef.current.set(
            requestKey,
            {
              data: nextData,
              offset:
                currentOffset +
                incoming.length,
              hasMore:
                !reachedEnd,
            }
          );

          setSuggestionsSync(
            nextData
          );

          setHasMore(
            !reachedEnd
          );

          lastRequestKeyRef.current =
            requestKey;

          await searchResultsCache.set(
            persistentCacheKey,
            nextData
          );

          if (__DEV__) {
            console.log(
              [
                "🔎 pesquisa",
                `query="${normalized}"`,
                `offset=${currentOffset}`,
                `incoming=${incoming.length}`,
                `total=${nextData.length}`,
                `sort=${requestOptions.sort}`,
                `players=${requestOptions.playerCount ?? "-"}`,
                `rating=${requestOptions.minBggRating ?? "-"}`,
                `expansion=${requestOptions.isExpansion ?? "all"}`,
                `reachedEnd=${reachedEnd}`,
              ].join(" | ")
            );
          }
        } catch (err: any) {
          /*
           * Se entretanto começou outro pedido, este erro pertence a uma
           * pesquisa antiga e deve ser completamente ignorado.
           *
           * Isto também cobre o comportamento do adapter React Native, que
           * em alguns cancelamentos pode expor "AxiosError: Network Error"
           * em vez de CanceledError.
           */
          if (
            myRequestId !==
            requestIdRef.current
          ) {
            return;
          }

          const cancelled =
            controller.signal.aborted ||
            err?.name ===
              "AbortError" ||
            err?.name ===
              "CanceledError" ||
            err?.code ===
              "ERR_CANCELED" ||
            err?.message ===
              "canceled" ||
            err?.__CANCEL__ === true;

          if (!cancelled) {
            console.error(
              "❌ Error fetching suggestions:",
              err
            );

            /*
             * Se uma página falhar, não deixamos o FlatList avançar automaticamente.
             * Um novo pedido só deve acontecer por nova pesquisa/refresh explícito.
             */
            setHasMore(false);

            setError(
              "Não foi possível carregar os resultados. Tenta novamente."
            );
          }
        } finally {
          if (
            myRequestId ===
            requestIdRef.current
          ) {
            abortControllerRef.current =
              null;

            activeRequestKeyRef.current =
              "";

            setLoadingSync(false);
          }
        }
      },
      [
        normalizedOptions,
        reset,
        scope,
        setLoadingSync,
        setSuggestionsSync,
      ]
    );

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;

      abortControllerRef.current?.abort();
      abortControllerRef.current =
        null;

      activeRequestKeyRef.current =
        "";
    };
  }, []);

  return {
    suggestions,
    loading,
    error,
    hasMore,
    fetchSuggestions,
    resetSuggestions: reset,
  } as const;
};