/**
 * useGameSessions.ts
 *
 * Hook para gerir sessões de jogo.
 * - Carrega sessões do utilizador (organizer + convidado)
 * - Cria nova sessão com convites iniciais
 * - Fecha sessão ativa
 */

import { useCallback, useEffect, useState } from "react";
import { GameSession } from "../types/GameSession";
import sessionService, { CreateSessionPayload } from "../services/sessionService";

export function useGameSessions() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Carrega as sessões do utilizador ─────────────────────────────────── */
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // getMine() devolve sessões onde o utilizador é organizer ou convidado
      const data = await sessionService.getMine();
      setSessions(data);
    } catch (err) {
      console.error("❌ Erro ao carregar sessões:", err);
      setError("Não foi possível carregar as sessões.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Cria uma nova sessão ──────────────────────────────────────────────── */
  const createSession = async (payload: CreateSessionPayload): Promise<GameSession | null> => {
    try {
      const newSession = await sessionService.create(payload);
      // Adiciona à lista localmente para evitar re-fetch
      setSessions((prev) => [newSession, ...prev]);
      return newSession;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Erro a criar sessão.";
      console.error("❌ Erro ao criar sessão:", err);
      setError(String(msg));
      return null;
    }
  };

  /* ── Fecha uma sessão ativa ────────────────────────────────────────────── */
  const closeSession = async (id: string): Promise<boolean> => {
    try {
      await sessionService.close(id);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "Closed" as const, endDate: new Date().toISOString() }
            : s
        )
      );
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Erro ao encerrar sessão.";
      console.error("❌ Erro ao encerrar sessão:", err);
      setError(String(msg));
      return false;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    closeSession,
  };
}