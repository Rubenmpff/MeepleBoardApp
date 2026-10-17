// src/features/games/services/matchService.ts

import api, { friendlyErrorMessage } from "@/src/services/api";
import i18n from "i18next";
import { MatchDto, MatchFormData, LastMatch } from "../types/MatchForm";
import { JournalEntry, UpsertJournalEntryPayload } from "../../campaigns/types/Campaign";
import { mapMatchFormToRequest } from "../utils/mapMatchFormToRequest";

/**
 * Match lists: the API answers 204 No Content when there are none (axios then gives data ""),
 * and an array otherwise. Anything else is invalid and is reported, never turned into an empty list.
 */
export function matchList(res: { status: number; data: unknown }, what: string): MatchDto[] {
  if (res.status === 204) return [];
  if (Array.isArray(res.data)) return res.data as MatchDto[];
  throw new Error(`Resposta inválida ao carregar ${what}.`);
}

function extractApiErrorMessage(error: any, fallback: string) {
  return friendlyErrorMessage(error, fallback);
}

const matchService = {
  /** Regista uma nova partida (quick ou sessão). */
  async registerMatch(data: MatchFormData): Promise<MatchDto> {
    if (!data) throw new Error(i18n.t("matches:errors.incomplete"));
    if (!data.gameId) throw new Error(i18n.t("matches:errors.incomplete"));
    if (!data.gameName) throw new Error(i18n.t("matches:errors.incomplete"));
    if (!data.matchDate) throw new Error(i18n.t("matches:errors.incomplete"));
    if (!Array.isArray(data.players) || data.players.length === 0)
      throw new Error(i18n.t("matches:errors.incomplete"));

    const payload = mapMatchFormToRequest(data);
    try {
      const res = await api.post<MatchDto>("/matches", payload);
      return res.data;
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:errors.register")));
    }
  },

  /** Última partida do utilizador autenticado. */
  async getLastMatch(): Promise<LastMatch | null> {
    try {
      const res = await api.get<LastMatch>("/matches/last");
      return res.data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:errors.lastMatch")));
    }
  },

  /** Historial de partidas do utilizador para um jogo específico. */
  async getHistoryByGame(gameId: string): Promise<MatchDto[]> {
    let res;
    try {
      res = await api.get<MatchDto[]>(`/matches/history/game/${gameId}`);
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:errors.history")));
    }
    return matchList(res, "o histórico");
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
    let res;
    try {
      res = await api.get<MatchDto[]>("/matches/pending-journal");
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:errors.pending")));
    }
    return matchList(res, "as partidas pendentes");
  },

  /** Obter uma partida pelo ID. */
  async getById(matchId: string): Promise<MatchDto | null> {
    try {
      const res = await api.get<MatchDto>(`/matches/${matchId}`);
      return res.data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:errors.load")));
    }
  },

  /** Obter entradas de diário de uma partida. */
  async getJournalEntries(matchId: string): Promise<JournalEntry[]> {
    try {
      const res = await api.get<JournalEntry[]>(`/campaigns/matches/${matchId}/journal`);
      return res.data ?? [];
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:errors.journalAccess")));
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
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:journal.saveError")));
    }
  },

  /**
   * Envia uma foto para a entrada de diário do utilizador nesta partida.
   * `photoUri` é o URI local do ficheiro (ex: devolvido pelo expo-image-picker).
   */
  async uploadJournalPhoto(matchId: string, photoUri: string): Promise<JournalEntry> {
    try {
      const filename = photoUri.split("/").pop() || `photo_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : "jpg";
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

      const formData = new FormData();
      // @ts-ignore — formato esperado pelo fetch/axios em React Native
      formData.append("file", { uri: photoUri, name: filename, type: mimeType });

      const res = await api.post<JournalEntry>(
        `/campaigns/matches/${matchId}/journal/photos`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:photos.uploadError")));
    }
  },

  /** Remove uma foto da entrada de diário do utilizador nesta partida. */
  async removeJournalPhoto(matchId: string, photoUrl: string): Promise<JournalEntry> {
    try {
      const res = await api.delete<JournalEntry>(
        `/campaigns/matches/${matchId}/journal/photos`,
        { params: { photoUrl } }
      );
      return res.data;
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:photos.removeError")));
    }
  },

  /**
   * Fechar o diário de uma partida manualmente (só o criador).
   */
  /** Corrects the duration of a match and how it was obtained; only its creator may do it. */
  async updateDuration(matchId: string, durationInMinutes: number | null, durationMethod: "Measured" | "Estimated" | "Unknown" | null): Promise<void> {
    try {
      await api.patch(`/matches/${matchId}/duration`, { durationInMinutes, durationMethod });
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:duration.saveError")));
    }
  },

  async closeJournal(matchId: string): Promise<void> {
    try {
      await api.post(`/matches/${matchId}/close-journal`, null);
    } catch (error: any) {
      throw new Error(extractApiErrorMessage(error, i18n.t("matches:errors.closeJournal")));
    }
  },
};

export default matchService;

export const registerMatch = (data: MatchFormData) => matchService.registerMatch(data);
export const getLastMatch = () => matchService.getLastMatch();