// src/features/games/hooks/useRegisterMatch.ts

import { useState } from "react";
import matchService from "../services/matchService";
import { MatchFormData, MatchDto } from "../types/MatchForm";

type SubmitOptions = {
  /** Se vier, cria match dentro desta sessão */
  sessionId?: string;
};

function extractApiMessage(err: any): string | null {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) return data;

  const msg = data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;

  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const firstKey = Object.keys(errors)[0];
    const firstVal = firstKey ? errors[firstKey] : null;
    if (Array.isArray(firstVal) && firstVal[0]) return String(firstVal[0]);
  }

  const fallback = err?.message;
  if (typeof fallback === "string" && fallback.trim()) return fallback;

  return null;
}

export function useRegisterMatch() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submete a partida e retorna o MatchDto criado (ou null em caso de erro).
   * Retorna o MatchDto para permitir associar a partida a uma campanha após criação.
   */
  const submitMatch = async (
    data: MatchFormData,
    options?: SubmitOptions
  ): Promise<MatchDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const payload: MatchFormData = options?.sessionId
        ? { ...data, sessionId: options.sessionId }
        : data;

      const created = await matchService.registerMatch(payload);
      return created;
    } catch (err: any) {
      console.error("❌ Failed to register match:", err);
      setError(extractApiMessage(err) ?? "Não foi possível registar a partida. Tenta novamente.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitMatch, loading, error };
}