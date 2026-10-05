// src/features/games/hooks/usePendingJournal.ts

import { useCallback, useEffect, useState } from "react";
import matchService from "../services/matchService";

export function usePendingJournal() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const matches = await matchService.getPendingJournalMatches();
      setCount(matches.length);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { count, loading, refetch: fetch };
}