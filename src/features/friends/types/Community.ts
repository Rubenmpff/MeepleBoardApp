export type PersonReportReason = "Abuse" | "Harassment" | "OffensiveName" | "Spam" | "Other";
export const PERSON_REPORT_REASONS: PersonReportReason[] = ["Abuse", "Harassment", "OffensiveName", "Spam", "Other"];
export type PhotoReportReason = "Inappropriate" | "PersonalData" | "Harassment" | "Spam" | "Other";
export const PHOTO_REPORT_REASONS: PhotoReportReason[] = ["Inappropriate", "PersonalData", "Harassment", "Spam", "Other"];

export type BlockedPerson = { id: string; userName: string; blockedAt: string };

/** Administrators only. */
export type ModerationPerson = { userId: string; userName: string; reasons: Partial<Record<PersonReportReason, number>>; details: string[];
  lastReportAt: string | null; suspended: boolean; suspendedAt: string | null; suspendedUntil: string | null; suspensionReason: string | null };
export type ModerationPhoto = { journalEntryId: string; matchId: string; photoKey: string; imagePath: string; ownerName: string;
  reasons: Partial<Record<PhotoReportReason, number>>; details: string[]; lastReportAt: string; present: boolean;
  /** Published in the community (visible, or hidden only by reports until reviewed). */
  published?: boolean; autoHidden?: boolean };
/** 7 or 30 days; null: until review. */
export type SuspensionPeriod = 7 | 30 | null;
