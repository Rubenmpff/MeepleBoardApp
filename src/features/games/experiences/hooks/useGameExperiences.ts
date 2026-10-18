import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import experienceService from "../services/experienceService";
import { ExperiencePage } from "../types/Experience";

/** Published experiences of a game, newest first; loaded again whenever the page comes back (e.g. after a withdrawal). */
export function useGameExperiences(gameId: string | undefined, limit = 3) {
  const [data, setData] = useState<ExperiencePage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    if (!gameId) return;
    setLoading(true); setError(false);
    try { setData(await experienceService.listForGame(gameId, 0, limit)); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [gameId, limit]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return { data, loading, error, reload: load };
}
