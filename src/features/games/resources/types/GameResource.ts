/** External link about a game (rules, videos, 3D models…), as the API returns it. */
export type ResourceKind = "Rules" | "HowToPlay" | "Playthrough" | "PrintModel" | "Unboxing" | "Material";
export type PrintCategory = "Organizer" | "Accessory" | "ReplacementPart" | "Decorative";
export type ResourceStatus = "Pending" | "Approved" | "Rejected";
export type ReportReason = "BrokenLink" | "WrongGame" | "WrongLanguage" | "Incompatible" | "Other";

export interface GameResource {
  id: string;
  gameId: string;
  kind: ResourceKind;
  printCategory: PrintCategory | null;
  /** ISO 639-1 code; null when it does not depend on a language (e.g. a 3D model). */
  language: string | null;
  title: string;
  author: string | null;
  platform: string;
  url: string;
  compatibility: string | null;
  isOfficial: boolean;
  /** Only set when the price was confirmed. */
  isFree: boolean | null;
  status: ResourceStatus;
}

export interface ResourceLanguage { code: string | null; count: number; kinds: Partial<Record<ResourceKind, number>> }

export interface GameResourceList {
  language: string;
  items: GameResource[];
  /** Approved resources per language, to offer alternatives. */
  languages: ResourceLanguage[];
  total: number;
}

export type GameResourceInput = Omit<GameResource, "id" | "gameId" | "status">;

export interface GameResourceAdmin {
  resource: GameResource;
  gameName: string;
  suggestedBy: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  openReports: number;
}

export interface GameResourceReport {
  id: string;
  resourceId: string;
  resourceTitle: string;
  gameName: string;
  gameId: string;
  url: string;
  reason: ReportReason;
  comment: string | null;
  reportedBy: string;
  createdAt: string;
}

/** Areas of the game page and the kinds each one shows, in order. */
export const AREA_KINDS = {
  howToPlay: ["Rules", "HowToPlay", "Playthrough"],
  resources: ["PrintModel", "Unboxing", "Material"],
} as const satisfies Record<string, readonly ResourceKind[]>;
export const PRINT_CATEGORIES: PrintCategory[] = ["Organizer", "Accessory", "ReplacementPart", "Decorative"];
export const REPORT_REASONS: ReportReason[] = ["BrokenLink", "WrongGame", "WrongLanguage", "Incompatible", "Other"];
