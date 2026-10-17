import { friendlyErrorMessage } from "@/src/services/api";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { getLastMatch } from "@/src/features/games/matches/services/matchService";
import { LastMatch } from "../../games/matches/types/MatchForm";

export const useLastMatch = () => {
  const [data, setData] = useState<LastMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // A silent refetch keeps the current card while new data arrives.
  const fetchLastMatch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await getLastMatch();
      setData(result);
      setError(null);
    } catch (err: unknown) {
      console.error("❌ Erro ao buscar última partida:", err);
      const message = friendlyErrorMessage(err, i18n.t("dashboard:lastMatch.loadError"));
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLastMatch();
  }, [fetchLastMatch]);

  return {
    data,
    loading,
    error,
    refetch: fetchLastMatch,
  };
};
