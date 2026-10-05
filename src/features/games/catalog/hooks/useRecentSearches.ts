// src/features/games/catalog/hooks/useRecentSearches.ts
import { useCallback, useEffect, useState } from "react";
import recentSearchesService, { RecentSearchEntry } from "../services/recentSearchesService";

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);

  useEffect(() => {
    recentSearchesService.getRecent().then(setRecentSearches);
  }, []);

  const addSearch = useCallback(async (term: string, imageUrl?: string) => {
    const updated = await recentSearchesService.addRecent(term, imageUrl);
    setRecentSearches(updated);
  }, []);

  const removeSearch = useCallback(async (term: string) => {
    const updated = await recentSearchesService.removeRecent(term);
    setRecentSearches(updated);
  }, []);

  const clearSearches = useCallback(async () => {
    await recentSearchesService.clearRecent();
    setRecentSearches([]);
  }, []);

  return { recentSearches, addSearch, removeSearch, clearSearches };
}