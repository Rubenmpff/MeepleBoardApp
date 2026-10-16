import api from "@/src/services/api";
import { ExperiencePage, Publication, ReportedExperience, ReportReason } from "../types/Experience";

const message = (error: any, fallback: string) => error?.response?.data?.message ?? fallback;

const experienceService = {
  async getMine(matchId: string): Promise<Publication> {
    return (await api.get<Publication>(`/campaigns/matches/${matchId}/journal/publication`)).data;
  },
  /** Explicit choices: show the rating with your name; keep or publish a comment. */
  async set(matchId: string, body: { showRating: boolean; comment: string | null; publishComment: boolean }): Promise<Publication> {
    try { return (await api.put<Publication>(`/campaigns/matches/${matchId}/journal/publication`, body)).data; }
    catch (error) { throw new Error(message(error, "Não foi possível publicar.")); }
  },
  async change(matchId: string, change: "withdraw-rating" | "withdraw-comment" | "delete-comment"): Promise<Publication> {
    return (await api.post<Publication>(`/campaigns/matches/${matchId}/journal/publication/${change}`)).data;
  },
  async listForGame(gameId: string, offset = 0, limit = 20): Promise<ExperiencePage> {
    return (await api.get<ExperiencePage>(`/game/${gameId}/experiences`, { params: { offset, limit } })).data;
  },
  async report(id: string, reason: ReportReason, detail?: string): Promise<void> {
    try { await api.post(`/experiences/${id}/reports`, { reason, detail: detail?.trim() || null }); }
    catch (error) { throw new Error(message(error, "Não foi possível enviar o relatório.")); }
  },
  async reported(): Promise<ReportedExperience[]> {
    return (await api.get<ReportedExperience[]>("/admin/experiences/reported")).data;
  },
  async moderate(id: string, decision: "keep" | "hide" | "restore", reason?: ReportReason): Promise<void> {
    await api.post(`/admin/experiences/${id}/${decision}`, { reason: reason ?? null });
  },
};

export default experienceService;
