// src/features/games/catalog/hooks/useRecentSearches.ts
import { useCallback, useEffect, useState } from "react";
import recentSearchesService, { RecentSearchEntry } from "../services/recentSearchesService";
import { useAccountId } from "@/src/shared/hooks/useAccountMemory";

export function useRecentSearches() {
  const account = useAccountId();
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);

  // Each account sees only its own recent searches.
  useEffect(() => {
    recentSearchesService.setAccount(account);
    recentSearchesService.getRecent().then(setRecentSearches);
  }, [account]);

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