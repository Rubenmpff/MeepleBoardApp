import { useEffect, useState } from "react";
import { GameSession } from "../types/GameSession";
import sessionService from "../services/sessionService";

/**
 * Hook para gerir as sessões de jogo (listar, criar, fechar).
 * Agora o organizador é obtido automaticamente via token JWT.
 */
export function useGameSessions() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 🔹 Carrega todas as sessões do utilizador */
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch (err) {
      console.error("❌ Erro ao carregar sessões:", err);
      setError("Falha ao carregar as sessões de jogo.");
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Cria uma nova sessão (organizador = utilizador autenticado) */
  const createSession = async (name: string, location?: string) => {
    try {
      const newSession = await sessionService.create({ name, location });
      setSessions((prev) => [...prev, newSession]);
      return newSession;
    } catch (err) {
      console.error("❌ Erro ao criar sessão:", err);
      setError("Falha ao criar sessão de jogo.");
      return null;
    }
  };

  /** 🔹 Fecha uma sessão ativa */
  const closeSession = async (id: string) => {
    try {
      await sessionService.close(id);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isActive: false, endDate: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      console.error("❌ Erro ao encerrar sessão:", err);
      setError("Falha ao encerrar a sessão.");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return { sessions, loading, error, fetchSessions, createSession, closeSession };
}
