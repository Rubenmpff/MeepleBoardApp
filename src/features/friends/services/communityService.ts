import api, { friendlyErrorMessage } from "@/src/services/api";
import i18n from "i18next";
import { BlockedPerson, ModerationPerson, ModerationPhoto, PersonReportReason, PhotoReportReason, SuspensionPeriod } from "../types/Community";

/** Translated and never technical; the context says what failed. */
const fail = (error: unknown, key: string) => new Error(friendlyErrorMessage(error, i18n.t(key)));

/**
 * Blocks and reports (docs/proposta-bloqueio-comunidade.md). The server applies every rule; the other person is never told.
 */
const communityService = {
  async blocks(): Promise<BlockedPerson[]> {
    return (await api.get<BlockedPerson[]>("/community/blocks")).data ?? [];
  },
  async block(userId: string): Promise<void> {
    try { await api.post(`/community/blocks/${userId}`); }
    catch (error) { throw fail(error, "friends:community.errors.block"); }
  },
  /** The author of a publication on a game page (the list never carries the author's id). */
  async blockAuthor(publicationId: string): Promise<void> {
    try { await api.post(`/community/blocks/experiences/${publicationId}`); }
    catch (error) { throw fail(error, "friends:community.errors.block"); }
  },
  async unblock(userId: string): Promise<void> {
    try { await api.delete(`/community/blocks/${userId}`); }
    catch (error) { throw fail(error, "friends:community.errors.unblock"); }
  },
  async reportPerson(userId: string, reason: PersonReportReason, detail?: string): Promise<void> {
    try { await api.post(`/community/people/${userId}/reports`, { reason, detail: detail?.trim() || null }); }
    catch (error) { throw fail(error, "friends:community.errors.report"); }
  },
  /** photoPath is the protected path the diary gives (…/journal/photos/{entryId}/{key}). */
  async reportPhoto(photoPath: string, reason: PhotoReportReason, detail?: string): Promise<void> {
    const route = photoPath.replace(/^\/MeepleBoard/, "");
    try { await api.post(`${route}/reports`, { reason, detail: detail?.trim() || null }); }
    catch (error) { throw fail(error, "friends:community.errors.report"); }
  },

  async moderationPeople(): Promise<ModerationPerson[]> {
    return (await api.get<ModerationPerson[]>("/admin/moderation/people")).data ?? [];
  },
  async moderationPhotos(): Promise<ModerationPhoto[]> {
    return (await api.get<ModerationPhoto[]>("/admin/moderation/photos")).data ?? [];
  },
  async archive(userId: string): Promise<void> {
    try { await api.post(`/admin/moderation/people/${userId}/archive`); }
    catch (error) { throw fail(error, "games:experiences.errors.moderate"); }
  },
  async suspend(userId: string, days: SuspensionPeriod, reason: string): Promise<void> {
    try { await api.post(`/admin/moderation/people/${userId}/suspend`, { days, reason }); }
    catch (error) { throw fail(error, "games:experiences.errors.moderate"); }
  },
  async liftSuspension(userId: string): Promise<void> {
    try { await api.post(`/admin/moderation/people/${userId}/lift-suspension`); }
    catch (error) { throw fail(error, "games:experiences.errors.moderate"); }
  },
  async moderatePhoto(photo: ModerationPhoto, decision: "keep" | "remove"): Promise<void> {
    try { await api.post(`/admin/moderation/photos/${photo.journalEntryId}/${photo.photoKey}/${decision}`); }
    catch (error) { throw fail(error, "games:experiences.errors.moderate"); }
  },
};

export default communityService;
