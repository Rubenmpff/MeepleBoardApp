// src/features/games/hooks/useGameSuggestions.ts
import { useEffect, useRef, useState } from "react";
import gameService from "../services/gameService";
import type { GameSuggestion } from "../types/GameSuggestion";

type SuggestionScope = "base" | "all";
const PAGE_SIZE = 10;

/**
 * Hook that retrieves board-game suggestions from the API
 * with pagination, de-duplication and simple in-memory caching.
 *
 * The cache is **per-session only** (cleared on full reload),
 * which is enough to prevent the “request-storm” you were seeing.
 */
export const useGameSuggestions = (scope: SuggestionScope = "all") => {
  /* ──────────────────────────── UI state */
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [hasMore, setHasMore]         = useState(true);
  const [lastQuery, setLastQuery]     = useState("");

  /* We keep offset per query inside the cache instead of a single number */
  type CacheEntry = {
    data   : GameSuggestion[];
    offset : number;   // next offset to ask for
    hasMore: boolean;
  };
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  /* ──────────────────────────── internals */
  const requestId    = useRef(0);               // drops stale responses
  const abortCtrlRef = useRef<AbortController | null>(null);

  /** Clears everything and aborts any in-flight request. */
  const reset = () => {
    abortCtrlRef.current?.abort();
    setSuggestions([]);
    setHasMore(true);
    setError(null);
    setLastQuery("");
  };

  /**
   * Fetches suggestions (with pagination).
   * @param query        – user text
   * @param forceReload  – ignore cache & start from page 0
   */
  const fetchSuggestions = async (query: string, forceReload = false) => {
    const normalised = query.trim().toLowerCase();

    /* Guard 1 – at least 3 chars */
    if (normalised.length < 3) {
      reset();
      return;
    }

    /* Guard 2 – already loading */
    if (loading) return;

    const cache     = cacheRef.current.get(normalised);
    const isNewQuery = normalised !== lastQuery;
    const freshRequest = forceReload || isNewQuery;

    /* Guard 3 – nothing more to load */
    if (!freshRequest && cache && !cache.hasMore) return;

    /* Serve from cache instantly when possible (no network lag) */
    if (!freshRequest && cache) {
      setSuggestions(cache.data);
      setHasMore(cache.hasMore);
    }

    const currentOffset = freshRequest ? 0 : cache?.offset ?? 0;

    setLoading(true);
    setError(null);

    /* Abort the previous request (if any) */
    abortCtrlRef.current?.abort();
    const controller        = new AbortController();
    abortCtrlRef.current    = controller;
    const myRequestId       = ++requestId.current;

    try {
      /* Decide which endpoint to call */
      const apiFn = scope === "base"
        ? gameService.getBaseGameSuggestions
        : gameService.getSuggestions;

      const incoming = await apiFn(
        normalised,
        currentOffset,
        PAGE_SIZE,
        { signal: controller.signal }
      );

      /* Drop response if another request finished later */
      if (myRequestId !== requestId.current) return;

      /* Merge / replace data */
      const uniqKey = (g: GameSuggestion) => g.bggId;
      const nextData = freshRequest
        ? incoming
        : [
            ...(cache?.data ?? []),
            ...incoming.filter(s =>
              !(cache?.data ?? []).some(p => uniqKey(p) === uniqKey(s))
            ),
          ];

      /* Cache the combined data */
      cacheRef.current.set(normalised, {
        data   : nextData,
        offset : currentOffset + incoming.length,
        hasMore: incoming.length === PAGE_SIZE,
      });

      /* Push to state for UI */
      setSuggestions(nextData);
      setHasMore(incoming.length === PAGE_SIZE);
      setLastQuery(normalised);

      if (__DEV__) {
        console.log(
          `🔎 query="${normalised}" | got ${incoming.length} | total ${nextData.length} | nextOffset ${currentOffset + incoming.length}`
        );
      }
    } catch (err: any) {
      /* Ignore abort / cancel errors */
      const cancelled =
        err?.name === "AbortError"       ||
        err?.name === "CanceledError"    ||
        err?.message === "canceled"      ||
        err?.__CANCEL__ === true;

      if (!cancelled) {
        console.error("❌ Error fetching suggestions:", err);
        setError("Unable to load suggestions. Please try again.");
        setHasMore(false);

        /* Mark this query as exhausted to avoid loops */
        cacheRef.current.set(normalised, {
          data   : cache?.data ?? [],
          offset : cache?.offset ?? 0,
          hasMore: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /* Abort request when the hook unmounts */
  useEffect(() => () => abortCtrlRef.current?.abort(), []);

  return {
    /* state */
    suggestions,
    loading,
    error,
    hasMore,

    /* actions */
    fetchSuggestions,
    resetSuggestions: reset,
  } as const;
};
