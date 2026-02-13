import { useState, useEffect, useCallback } from "react";
import sessionService from "../services/sessionService";
import { MatchFormData } from "../types/MatchForm";

/**
 * Hook para gerir as partidas associadas a uma sessão de jogo.
 * - Lê os dados diretamente do backend (via sessionService)
 * - Garante estados de loading e erro consistentes
 */
export function useSessionMatches(sessionId: string | undefined) {
  const [matches, setMatches] = useState<MatchFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 🔹 Busca as partidas da sessão */
  const fetchMatches = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const session = await sessionService.getById(sessionId);

      if (!session) {
        setError("Sessão não encontrada.");
        setMatches([]);
        return;
      }

      setMatches(session.matches ?? []);
    } catch (err: any) {
      console.error("❌ Erro ao carregar partidas da sessão:", err);
      setError("Falha ao obter partidas da sessão.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  /** 🔹 Atualiza a lista local após adicionar nova partida */
  const addMatchToList = (newMatch: MatchFormData) => {
    setMatches((prev) => [newMatch, ...prev]);
  };

  return {
    matches,
    loading,
    error,
    fetchMatches,
    addMatchToList,
  };
}
