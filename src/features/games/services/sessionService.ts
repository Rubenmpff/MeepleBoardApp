import api from "@/src/services/api";
import { GameSession } from "../types/GameSession";
import { MatchFormData } from "../types/MatchForm";
import { tokenService } from "@/src/services/tokenService";

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

  /** 🔹 Adiciona um jogador à sessão */
  addPlayer: async (sessionId: string, userId: string, isOrganizer = false): Promise<void> => {
    const token = await tokenService.getValidToken();
    await api.post(
      `${BASE_URL}/${sessionId}/players`,
      { userId, isOrganizer },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  /** 🔹 Remove um jogador de uma sessão */
  removePlayer: async (sessionId: string, userId: string): Promise<void> => {
    const token = await tokenService.getValidToken();
    await api.delete(`${BASE_URL}/${sessionId}/players/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** 🔹 Adiciona uma partida (match) à sessão */
  addMatch: async (sessionId: string, match: MatchFormData): Promise<void> => {
    const token = await tokenService.getValidToken();
    await api.post(`${BASE_URL}/${sessionId}/matches`, match, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default sessionService;
