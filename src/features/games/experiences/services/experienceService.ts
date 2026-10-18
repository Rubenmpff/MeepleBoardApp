import api, { friendlyErrorMessage } from "@/src/services/api";
import i18n from "i18next";
import { ExperiencePage, Publication, ReportedExperience, ReportReason } from "../types/Experience";

/** Translated and never technical; the context says what failed. */
const fail = (error: unknown, key: string) => new Error(friendlyErrorMessage(error, i18n.t(key)));

const experienceService = {
  async getMine(matchId: string): Promise<Publication> {
    return (await api.get<Publication>(`/campaigns/matches/${matchId}/journal/publication`)).data;
  },
  /**
   * Explicit choices: show the rating with your name; keep or publish a comment; photoKeys (own diary photos, at most 3)
   * with photoConsent, the confirmation required whenever a photo is added. Without photoKeys the photos stay as they are.
   */
  async set(matchId: string, body: { showRating: boolean; comment: string | null; publishComment: boolean; photoKeys?: string[]; photoConsent?: boolean }): Promise<Publication> {
    try { return (await api.put<Publication>(`/campaigns/matches/${matchId}/journal/publication`, body)).data; }
    catch (error) { throw fail(error, "matches:publish.error"); }
  },
  async change(matchId: string, change: "withdraw-rating" | "withdraw-comment" | "delete-comment" | "withdraw-all"): Promise<Publication> {
    try { return (await api.post<Publication>(`/campaigns/matches/${matchId}/journal/publication/${change}`)).data; }
    catch (error) { throw fail(error, "games:experiences.errors.change"); }
  },
  /** Leaves the community only; the photo stays in the diary, shared with the match's players. */
  async withdrawPhoto(matchId: string, photoId: string): Promise<Publication> {
    try { return (await api.delete<Publication>(`/campaigns/matches/${matchId}/journal/publication/photos/${photoId}`)).data; }
    catch (error) { throw fail(error, "games:experiences.errors.change"); }
  },
  async listForGame(gameId: string, offset = 0, limit = 20): Promise<ExperiencePage> {
    return (await api.get<ExperiencePage>(`/game/${gameId}/experiences`, { params: { offset, limit } })).data;
  },
  async report(id: string, reason: ReportReason, detail?: string): Promise<void> {
    try { await api.post(`/experiences/${id}/reports`, { reason, detail: detail?.trim() || null }); }
    catch (error) { throw fail(error, "games:experiences.errors.report"); }
  },
  async reported(): Promise<ReportedExperience[]> {
    return (await api.get<ReportedExperience[]>("/admin/experiences/reported")).data;
  },
  async moderate(id: string, decision: "keep" | "hide" | "restore", reason?: ReportReason): Promise<void> {
    try { await api.post(`/admin/experiences/${id}/${decision}`, { reason: reason ?? null }); }
    catch (error) { throw fail(error, "games:experiences.errors.moderate"); }
  },
};

export default experienceService;
