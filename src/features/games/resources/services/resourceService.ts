import api from "@/src/services/api";
import { GameResource, GameResourceAdmin, GameResourceInput, GameResourceList, GameResourceReport, ReportReason, ResourceStatus } from "../types/GameResource";

/** Game resource catalogue: public reading, suggestions, reports and administration. */
const resourceService = {
  /** language: "all" or a two-letter code; language-independent resources always come back. */
  async list(gameId: string, language: string): Promise<GameResourceList> {
    return (await api.get<GameResourceList>(`/game/${gameId}/resources`, { params: { language } })).data;
  },
  async suggest(gameId: string, input: GameResourceInput): Promise<GameResource> {
    return (await api.post<GameResource>(`/game/${gameId}/resources/suggestions`, input)).data;
  },
  async report(resourceId: string, reason: ReportReason, comment: string | null): Promise<void> {
    await api.post(`/game-resources/${resourceId}/reports`, { reason, comment });
  },
  async canManage(): Promise<boolean> {
    return (await api.get<{ canManage: boolean }>("/game-resources/permissions")).data.canManage;
  },

  async review(status?: ResourceStatus, gameId?: string): Promise<GameResourceAdmin[]> {
    return (await api.get<GameResourceAdmin[]>("/admin/game-resources", { params: { status, gameId } })).data;
  },
  async create(gameId: string, input: GameResourceInput): Promise<GameResource> {
    return (await api.post<GameResource>(`/admin/game/${gameId}/resources`, input)).data;
  },
  async update(id: string, input: GameResourceInput): Promise<GameResource> {
    return (await api.put<GameResource>(`/admin/game-resources/${id}`, input)).data;
  },
  async approve(id: string): Promise<GameResource> {
    return (await api.post<GameResource>(`/admin/game-resources/${id}/approve`)).data;
  },
  async reject(id: string, note: string | null): Promise<GameResource> {
    return (await api.post<GameResource>(`/admin/game-resources/${id}/reject`, { note })).data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/admin/game-resources/${id}`);
  },
  async reports(): Promise<GameResourceReport[]> {
    return (await api.get<GameResourceReport[]>("/admin/game-resources/reports")).data;
  },
  async resolveReport(id: string): Promise<void> {
    await api.post(`/admin/game-resources/reports/${id}/resolve`);
  },
};

export default resourceService;
