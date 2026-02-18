// src/features/games/services/matchService.ts

import api from "@/src/services/api";
import { MatchFormData, LastMatch } from "../types/MatchForm";
import { tokenService } from "@/src/services/tokenService";
import { mapMatchFormToRequest } from "../utils/mapMatchFormToRequest";

/**
 * Regista uma nova partida rápida (fora de sessão).
 * O backend deve garantir que o utilizador autenticado fica incluído nos players.
 */
export const registerMatch = async (data: MatchFormData): Promise<any> => {
  try {
    const token = await tokenService.getValidToken();

    // Payload limpo para a API (playerIds + gameSessionId opcional)
    // Aqui é quick match, portanto não forçamos sessionId.
    const payload = mapMatchFormToRequest(data);

    const response = await api.post("/Matches", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to register match:", error?.response || error?.message || error);
    throw new Error("Failed to register match. Please check your input and try again.");
  }
};

/**
 * Busca a partida mais recente do utilizador autenticado.
 * Retorna null se não existir (404).
 */
export const getLastMatch = async (): Promise<LastMatch | null> => {
  try {
    const token = await tokenService.getValidToken();

    const response = await api.get<LastMatch>("/Matches/last", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;

    console.error("❌ Failed to fetch last match:", error);
    throw new Error("Failed to fetch last match. Please try again later.");
  }
};
