// src/features/games/services/sessionService.ts
import api from "@/src/services/api";
import { GameSession } from "../types/GameSession";
import { MatchFormData } from "../types/MatchForm";

const BASE_URL = "/session";

const sessionService = {
  /** Lista todas as sessões */
  getAll: async (): Promise<GameSession[]> => {
    const res = await api.get(BASE_URL);
    return res.data;
  },

  /** Busca uma sessão específica pelo ID */
  getById: async (id: string): Promise<GameSession> => {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  /** Cria uma nova sessão */
  create: async (data: { name: string; organizerId: string; location?: string }): Promise<GameSession> => {
    const res = await api.post(BASE_URL, data);
    return res.data;
  },

  /** Fecha uma sessão */
  close: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/close`);
  },

  /** Adiciona um jogador à sessão */
  addPlayer: async (sessionId: string, userId: string, isOrganizer = false): Promise<void> => {
    await api.post(`${BASE_URL}/${sessionId}/players`, { userId, isOrganizer });
  },

  /** Remove um jogador de uma sessão */
  removePlayer: async (sessionId: string, userId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${sessionId}/players/${userId}`);
  },

  /** Adiciona uma partida a uma sessão */
  addMatch: async (sessionId: string, match: MatchFormData): Promise<void> => {
    await api.post(`${BASE_URL}/${sessionId}/matches`, match);
  }
};

export default sessionService;
