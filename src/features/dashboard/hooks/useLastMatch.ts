import { useEffect, useState } from "react";
import { getLastMatch } from "@/src/features/games/services/matchService";
import { LastMatch } from "../../games/types/MatchForm";

export const useLastMatch = () => {
  const [data, setData] = useState<LastMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLastMatch = async () => {
    setLoading(true);
    try {
      const result = await getLastMatch();
      setData(result);
      setError(null);
    } catch (err: unknown) {
      console.error("❌ Erro ao buscar última partida:", err);
      const message =
        err instanceof Error ? err.message : "Erro ao buscar a última partida.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastMatch();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchLastMatch,
  };
};
