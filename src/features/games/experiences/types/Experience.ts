/** The participant's own publication for one match (rating with the name and/or a comment). */
export type Publication = { rated: boolean; rating: number | null; showRating: boolean; comment: string | null; commentPublished: boolean;
  edited: boolean; publishedAt: string | null; hidden: boolean; hiddenReason: string | null; photos?: PublishedPhoto[] };

/**
 * One of your diary photos published with the experience. key = the diary photo's key (last segment of its path);
 * diaryPath shows it (null once moderation removed it from the match). hiddenReason: why the community no longer sees it.
 */
export type PublishedPhoto = { id: string; key: string; diaryPath: string | null; hidden: boolean; hiddenReason: string | null; removed: boolean };
export const MAX_PUBLISHED_PHOTOS = 3;
/** Hidden automatically by reports (not an administrator's decision): the author may still withdraw it. */
export const AUTO_HIDDEN = "AutoReports";

/** A published experience as anyone signed in sees it: never the match, other participants, place or notes. */
export type Experience = { id: string; authorName: string; isMine: boolean; rating: number | null; comment: string | null;
  mode: "SOLO" | "COMPETITIVE" | "COOPERATIVE" | "UNKNOWN"; players: number; month: string; edited: boolean; canReport: boolean;
  /** Only on your own experience, to manage it. */
  ownMatchId: string | null;
  /** Public paths (/MeepleBoard/experiences/{id}/photos/{photoId}): they name no match, diary entry or storage. */
  photos?: string[] };

export type ExperiencePage = { items: Experience[]; total: number };
export type ReportReason = "Abusive" | "Spam" | "PersonalData" | "OffTopic" | "Other";
export const REPORT_REASONS: ReportReason[] = ["Abusive", "Spam", "PersonalData", "OffTopic", "Other"];
export type ReportedExperience = { id: string; authorName: string; gameName: string; rating: number | null; comment: string | null;
  reasons: Partial<Record<ReportReason, number>>; hidden: boolean; hiddenReason: string | null };
