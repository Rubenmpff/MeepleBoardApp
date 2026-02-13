import { useEffect, useRef, useState } from "react";
import gameService from "../services/gameService";
import type { Game } from "../types/Game";
import { normalizeToGame } from "../utils/normalizeToGame";

type SuggestionScope = "base" | "all";
const PAGE_SIZE = 10;

export const useGameSuggestions = (scope: SuggestionScope = "all") => {
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastQuery, setLastQuery] = useState("");

  const cacheRef = useRef<
    Map<string, { data: Game[]; offset: number; hasMore: boolean }>
  >(new Map());
  const requestId = useRef(0);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const reset = () => {
    abortCtrlRef.current?.abort();
    setSuggestions([]);
    setHasMore(true);
    setError(null);
    setLastQuery("");
    cacheRef.current.clear();
  };

  const fetchSuggestions = async (query: string, forceReload = false) => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 1) {
      if (suggestions.length > 0) reset();
      return;
    }

    if (loading) return;

    const cache = cacheRef.current.get(normalized);
    const isNewQuery = normalized !== lastQuery;
    const freshRequest = forceReload || isNewQuery || !cache;

    const currentOffset = freshRequest ? 0 : cache.offset;

    setLoading(true);
    setError(null);

    if (abortCtrlRef.current) abortCtrlRef.current.abort();
    const controller = new AbortController();
    abortCtrlRef.current = controller;
    const myRequestId = ++requestId.current;

    try {
      const apiFn =
        scope === "base"
          ? gameService.getBaseGameSuggestions
          : gameService.getSuggestions;

      const raw = await apiFn(normalized, currentOffset, PAGE_SIZE, {
        signal: controller.signal,
      });

      const incoming: Game[] = Array.isArray(raw)
        ? raw.map(normalizeToGame)
        : raw
        ? [normalizeToGame(raw)]
        : [];

      if (myRequestId !== requestId.current) return; // ignora resposta antiga

      // --- Merge sem duplicados (prioridade sempre bggId) ---
      const existing = freshRequest ? [] : suggestions;
      const uniq = new Map<string, Game>();
      [...existing, ...incoming].forEach((g) => {
        const key = g.bggId ? `bgg-${g.bggId}` : g.id ? `id-${g.id}` : `tmp-${Math.random()}`;
        uniq.set(key, g);
      });
      const nextData = Array.from(uniq.values());

      // ** MELHOR CRITÉRIO DE FIM **
      const reachedEnd = incoming.length < PAGE_SIZE;

      cacheRef.current.set(normalized, {
        data: nextData,
        offset: currentOffset + incoming.length,
        hasMore: !reachedEnd,
      });

      setSuggestions(nextData);
      setHasMore(!reachedEnd);
      setLastQuery(normalized);

      if (__DEV__) {
        console.log(
          `🔎 query="${normalized}" | offset=${currentOffset} | incoming=${incoming.length} | total=${nextData.length} | reachedEnd=${reachedEnd}`
        );
        if (reachedEnd) console.log("🏁 Chegou ao fim da lista de resultados");
      }
    } catch (err: any) {
      const cancelled =
        err?.name === "AbortError" ||
        err?.message === "canceled" ||
        err?.__CANCEL__ === true;
      if (!cancelled) {
        console.error("❌ Error fetching suggestions:", err);
        setError("Unable to load suggestions. Please try again.");
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => abortCtrlRef.current?.abort();
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
