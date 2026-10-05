import { useEffect, useState } from "react";
import { GameSuggestion } from "../types/GameSuggestion";
import gameService from "../services/gameService";

export const useExpansionsByBaseGame = (baseGameId: string) => {
  const [expansions, setExpansions] = useState<GameSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseGameId) {
      setExpansions([]);
      return;
    }

    const fetchExpansions = async () => {
      setLoading(true);
      try {
        const result = await gameService.getExpansionsOfBase(baseGameId);
        setExpansions(result ?? []);
        setError(null);
      } catch (err: any) {
        console.error("❌ Failed to load expansions:", err);
        setError("Failed to load expansions");
        setExpansions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpansions();
  }, [baseGameId]);

  return { expansions, loading, error };
};
