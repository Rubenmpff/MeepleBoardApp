import { useCallback, useEffect, useState } from "react";
import resourceService from "../services/resourceService";
import { GameResourceList } from "../types/GameResource";

/** Approved resources of a game in one language; loads only when enabled (the area is open). */
export function useGameResources(gameId: string | undefined, language: string, enabled: boolean) {
  const [data, setData] = useState<GameResourceList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!gameId) return;
    setLoading(true); setError(false);
    try { setData(await resourceService.list(gameId, language)); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [gameId, language]);

  useEffect(() => { if (enabled) void load(); }, [enabled, load]);

  return { data, loading, error, reload: load };
}
