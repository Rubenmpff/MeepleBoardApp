// src/features/games/services/matchService.ts

import api from "@/src/services/api";
import { MatchDto, MatchFormData, LastMatch } from "../types/MatchForm";
import { JournalEntry, UpsertJournalEntryPayload } from "../types/Campaign";
import { mapMatchFormToRequest } from "../utils/mapMatchFormToRequest";

function extractApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  const msg = data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const firstKey = Object.keys(errors)[0];
    const firstVal = firstKey ? errors[firstKey] : null;
    if (Array.isArray(firstVal) && firstVal[0]) return String(firstVal[0]);
  }
  const errMsg = error?.message;
  if (typeof errMsg === "string" && errMsg.trim()) return errMsg;
  return fallback;
}

const matchService = {
  /** Regista uma nova partida (quick ou sessão). */
  async registerMatch(data: MatchFormData): Promise<MatchDto> {
    if (!data) throw new Error("Dados da partida são obrigatórios.");
    if (!data.gameId) throw new Error("gameId é obrigatório.");
    if (!data.gameName) throw new Error("gameName é obrigatório.");
    if (!data.matchDate) throw new Error("matchDate é obrigatório.");
    if (!Array.isArray(data.players) || data.players.length === 0)
      throw new Error("A partida deve ter pelo menos um jogador.");

    const payload = mapMatchFormToRequest(data);
    try {
      const res = await api.post<MatchDto>("/matches", payload);
      return res.data;
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, "Erro ao registar partida."));
    }
  },

  /** Última partida do utilizador autenticado. */
  async getLastMatch(): Promise<LastMatch | null> {
    try {
      const res = await api.get<LastMatch>("/matches/last");
      return res.data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw new Error(extractApiErrorMessage(error, "Erro ao obter última partida."));
    }
  },

  /** Historial de partidas do utilizador para um jogo específico. */
  async getHistoryByGame(gameId: string): Promise<MatchDto[]> {
    try {
      const res = await api.get<MatchDto[]>(`/matches/history/game/${gameId}`);
      return res.data ?? [];
    } catch (error: any) {
      if (error?.response?.status === 204) return [];
      throw new Error(extractApiErrorMessage(error, "Erro ao carregar histórico."));
    }
  },

  /** Avaliação pessoal média do utilizador para um jogo. */
  async getUserRatingForGame(gameId: string): Promise<number | null> {
    try {
      const res = await api.get<{ rating: number | null; hasRating: boolean }>(
        `/matches/rating/game/${gameId}`
      );
      return res.data?.rating ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Partidas com diário aberto (Open) onde o utilizador ainda não avaliou.
   * Usado no ecrã "Partidas pendentes de avaliação".
   */
  async getPendingJournalMatches(): Promise<MatchDto[]> {
    try {
      const res = await api.get<MatchDto[]>("/matches/pending-journal");
      return res.data ?? [];
    } catch (error: any) {
      if (error?.response?.status === 204) return [];
      throw new Error(extractApiErrorMessage(error, "Erro ao carregar partidas pendentes."));
    }
  },

  /** Obter uma partida pelo ID. */
  async getById(matchId: string): Promise<MatchDto | null> {
    try {
      const res = await api.get<MatchDto>(`/matches/${matchId}`);
      return res.data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw new Error(extractApiErrorMessage(error, "Erro ao carregar partida."));
    }
  },

  /** Obter entradas de diário de uma partida. */
  async getJournalEntries(matchId: string): Promise<JournalEntry[]> {
    try {
      const res = await api.get<JournalEntry[]>(`/campaigns/matches/${matchId}/journal`);
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Submete ou atualiza a avaliação do utilizador para uma partida.
   * Rating obrigatório (0–10). Notas e tags opcionais.
   */
  async upsertJournalEntry(
    matchId: string,
    payload: UpsertJournalEntryPayload
  ): Promise<JournalEntry> {
    try {
      const res = await api.put<JournalEntry>(
        `/campaigns/matches/${matchId}/journal`,
        payload
      );
      return res.data;
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, "Erro ao guardar avaliação."));
    }
  },

  /**
   * Fechar o diário de uma partida manualmente (só o criador).
   */
  async closeJournal(matchId: string): Promise<void> {
    try {
      await api.post(`/matches/${matchId}/close-journal`, null);
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, "Erro ao fechar diário."));
    }
  },
};

export default matchService;

export const registerMatch = (data: MatchFormData) => matchService.registerMatch(data);
export const getLastMatch = () => matchService.getLastMatch();