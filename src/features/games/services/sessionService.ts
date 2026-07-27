import api from "@/src/services/api";
import { GameSession } from "../types/GameSession";
import { MatchDto, MatchFormData } from "../types/MatchForm";
import { mapMatchFormToRequest } from "../utils/mapMatchFormToRequest";

const BASE_URL = "/session";

export type CreateSessionPayload = {
  name: string;
  location?: string;
  scheduledStartDate?: string;
  responseDeadline?: string; // ✅ NOVO — data limite de resposta
  playerIds?: string[];
};

function assertId(id: string, label: string) {
  if (!id || typeof id !== "string") {
    throw new Error(`${label} inválido.`);
  }
}

const sessionService = {
  /** Lista as minhas sessões (organizer + convidado), sem canceladas */
  async getMine(): Promise<GameSession[]> {
    const res = await api.get<GameSession[]>(`${BASE_URL}/mine`);
    return res.data ?? [];
  },

  /** Debug/admin: lista todas as sessões */
  async getAll(): Promise<GameSession[]> {
    const res = await api.get<GameSession[]>(BASE_URL);
    return res.data ?? [];
  },

  /** Detalhe de uma sessão */
  async getById(id: string): Promise<GameSession> {
    assertId(id, "sessionId");
    const res = await api.get<GameSession>(`${BASE_URL}/${id}`);
    return res.data;
  },

  /** Cria sessão + convites iniciais (Pending) */
  async create(payload: CreateSessionPayload): Promise<GameSession> {
    if (!payload?.name || payload.name.trim().length < 3) {
      throw new Error("O nome da sessão deve ter pelo menos 3 caracteres.");
    }

    const body: CreateSessionPayload = {
      name: payload.name.trim(),
      location: payload.location?.trim() || undefined,
      scheduledStartDate: payload.scheduledStartDate,
      responseDeadline: payload.responseDeadline,
      playerIds: payload.playerIds ?? [],
    };

    const res = await api.post<GameSession>(BASE_URL, body);
    return res.data;
  },

  /** Fecha sessão com sucesso (só organizer) */
  async close(id: string): Promise<void> {
    assertId(id, "sessionId");
    await api.post(`${BASE_URL}/${id}/close`, null);
  },

  /** ✅ NOVO — Cancela sessão (só organizer, só Upcoming) */
  async cancel(id: string): Promise<void> {
    assertId(id, "sessionId");
    await api.post(`${BASE_URL}/${id}/cancel`, null);
  },

  /** Convida jogador (entra Pending) */
  async addPlayer(sessionId: string, userId: string): Promise<void> {
    assertId(sessionId, "sessionId");
    assertId(userId, "userId");
    await api.post(`${BASE_URL}/${sessionId}/players`, { userId });
  },

  /** Responder convite (aceitar/recusar) */
  async respondInvite(sessionId: string, accept: boolean): Promise<void> {
    assertId(sessionId, "sessionId");
    await api.post(`${BASE_URL}/${sessionId}/invites/respond`, { accept });
  },

  /**
   * @deprecated Usar matchService.registerMatch() com gameSessionId no payload.
   */
  async addMatch(sessionId: string, match: MatchFormData): Promise<MatchDto> {
    assertId(sessionId, "sessionId");
    const payload = mapMatchFormToRequest({ ...match, sessionId });
    const res = await api.post<MatchDto>("/matches", payload);
    return res.data;
  },

  async removePlayer(_sessionId: string, _userId: string): Promise<void> {
    throw new Error("Remover jogador não está disponível.");
  },
};

export default sessionService;
export { sessionService };