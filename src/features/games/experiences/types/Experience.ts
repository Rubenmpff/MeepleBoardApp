/** The participant's own publication for one match (rating with the name and/or a comment). */
export type Publication = { rated: boolean; rating: number | null; showRating: boolean; comment: string | null; commentPublished: boolean;
  edited: boolean; publishedAt: string | null; hidden: boolean; hiddenReason: string | null };

/** A published experience as anyone signed in sees it: never the match, other participants, place or notes. */
export type Experience = { id: string; authorName: string; isMine: boolean; rating: number | null; comment: string | null;
  mode: "SOLO" | "COMPETITIVE" | "COOPERATIVE" | "UNKNOWN"; players: number; month: string; edited: boolean; canReport: boolean;
  /** Only on your own experience, to manage it. */
  ownMatchId: string | null };

export type ExperiencePage = { items: Experience[]; total: number };
export type ReportReason = "Abusive" | "Spam" | "PersonalData" | "OffTopic" | "Other";
export const REPORT_REASONS: ReportReason[] = ["Abusive", "Spam", "PersonalData", "OffTopic", "Other"];
export type ReportedExperience = { id: string; authorName: string; gameName: string; rating: number | null; comment: string | null;
  reasons: Partial<Record<ReportReason, number>>; hidden: boolean; hiddenReason: string | null };
