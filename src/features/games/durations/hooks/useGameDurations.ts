import { useCallback, useEffect, useState } from "react";
import gameDurationService from "../services/gameDurationService";
import { GameDurations } from "../types/GameDurations";

/** Duration statistics of a game, read from current data each time the page loads them. */
export function useGameDurations(gameId: string | undefined) {
  const [data, setData] = useState<GameDurations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    if (!gameId) return;
    setLoading(true); setError(false);
    try { setData(await gameDurationService.get(gameId)); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [gameId]);
  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load };
}
