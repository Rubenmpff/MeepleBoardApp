import api from "@/src/services/api";
import { GameSession } from "../types/GameSession";
import { MatchFormData } from "../types/MatchForm";
import { tokenService } from "@/src/services/tokenService";
import { mapMatchFormToRequest } from "../utils/mapMatchFormToRequest";

const BASE_URL = "/session";

export const sessionService = {
  /** 🔹 Lista todas as sessões */
  getAll: async (): Promise<GameSession[]> => {
    const token = await tokenService.getValidToken();
    const res = await api.get(BASE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /** 🔹 Busca uma sessão específica pelo ID */
  getById: async (id: string): Promise<GameSession> => {
    const token = await tokenService.getValidToken();
    const res = await api.get(`${BASE_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /** 🔹 Cria uma nova sessão
   *  👉 O organizador é automaticamente obtido do token JWT no backend.
   */
  create: async (data: { name: string; location?: string }): Promise<GameSession> => {
    const token = await tokenService.getValidToken();
    const res = await api.post(BASE_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /** 🔹 Fecha uma sessão */
  close: async (id: string): Promise<void> => {
    const token = await tokenService.getValidToken();
    await api.post(`${BASE_URL}/${id}/close`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** 🔹 Adiciona um jogador à sessão
   *  ⚠️ Não enviar isOrganizer do frontend (segurança/regra de negócio).
   */
  addPlayer: async (sessionId: string, userId: string): Promise<void> => {
    const token = await tokenService.getValidToken();
    await api.post(
      `${BASE_URL}/${sessionId}/players`,
      { userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  /**
   * ❌ Remover jogadores da sessão (decisão de negócio: sessão só cresce)
   * Mantido apenas para compatibilidade caso ainda exista UI antiga.
   * Recomendação: não usar e remover chamadas no frontend.
   */
  removePlayer: async (sessionId: string, userId: string): Promise<void> => {
    const token = await tokenService.getValidToken();
    await api.delete(`${BASE_URL}/${sessionId}/players/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** 🔹 Adiciona uma partida (match) à sessão
   *  Envia payload "limpo" para o backend (playerIds + gameSessionId).
   */
  addMatch: async (sessionId: string, match: MatchFormData): Promise<void> => {
    const token = await tokenService.getValidToken();

    // Garantir que o match fica associado à sessão
    const payload = mapMatchFormToRequest({ ...match, sessionId });

    await api.post(`${BASE_URL}/${sessionId}/matches`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default sessionService;
