// src/features/games/hooks/useGameSuggestions.ts
import { useEffect, useRef, useState } from "react";
import gameService from "../services/gameService";
import type { Game } from "../types/Game";

type SuggestionScope = "base" | "all";
const PAGE_SIZE = 10;

export const useGameSuggestions = (scope: SuggestionScope = "all") => {
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastQuery, setLastQuery] = useState("");

  type CacheEntry = {
    data: Game[];
    offset: number;
    hasMore: boolean;
  };
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const requestId = useRef(0);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const reset = () => {
    abortCtrlRef.current?.abort();
    setSuggestions([]);
    setHasMore(true);
    setError(null);
    setLastQuery("");
  };

  const fetchSuggestions = async (query: string, forceReload = false) => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 3) {
      reset();
      return;
    }

    if (loading) return;

    const cache = cacheRef.current.get(normalized);
    const isNewQuery = normalized !== lastQuery;
    const freshRequest = forceReload || isNewQuery;

    if (!freshRequest && cache && !cache.hasMore) return;

    if (!freshRequest && cache) {
      setSuggestions(cache.data);
      setHasMore(cache.hasMore);
    }

    const currentOffset = freshRequest ? 0 : cache?.offset ?? 0;

    setLoading(true);
    setError(null);

    abortCtrlRef.current?.abort();
    const controller = new AbortController();
    abortCtrlRef.current = controller;
    const myRequestId = ++requestId.current;

    try {
      const apiFn =
        scope === "base"
          ? gameService.getBaseGameSuggestions
          : gameService.getSuggestions;

      const incoming = (await apiFn(
      normalized,
      currentOffset,
      PAGE_SIZE,
      { signal: controller.signal }
        )) as Game[];


      if (myRequestId !== requestId.current) return;

      const uniqKey = (g: Game) => g.id ?? g.bggId;
      const nextData = freshRequest
        ? incoming
        : [
            ...(cache?.data ?? []),
            ...incoming.filter(
              (g) => !(cache?.data ?? []).some((p) => uniqKey(p) === uniqKey(g))
            ),
          ];

      cacheRef.current.set(normalized, {
        data: nextData,
        offset: currentOffset + incoming.length,
        hasMore: incoming.length === PAGE_SIZE,
      });

      setSuggestions(nextData);
      setHasMore(incoming.length === PAGE_SIZE);
      setLastQuery(normalized);

      if (__DEV__) {
        console.log(
          `🔎 query="${normalized}" | got ${incoming.length} | total ${nextData.length} | nextOffset ${currentOffset + incoming.length}`
        );
      }
    } catch (err: any) {
      const cancelled =
        err?.name === "AbortError" ||
        err?.name === "CanceledError" ||
        err?.message === "canceled" ||
        err?.__CANCEL__ === true;

      if (!cancelled) {
        console.error("❌ Error fetching suggestions:", err);
        setError("Unable to load suggestions. Please try again.");
        setHasMore(false);

        cacheRef.current.set(normalized, {
          data: cache?.data ?? [],
          offset: cache?.offset ?? 0,
          hasMore: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => abortCtrlRef.current?.abort(), []);

  return {
    suggestions,
    loading,
    error,
    hasMore,
    fetchSuggestions,
    resetSuggestions: reset,
  } as const;
};
