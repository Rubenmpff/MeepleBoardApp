import { UI_COLORS } from "./appTheme";

// Status keeps its semantic colour; actions continue to use the primary colour.
export const SESSION_STATUS_COLORS = {
  Upcoming: UI_COLORS.secondary,
  Active: UI_COLORS.success,
  Closed: UI_COLORS.textMuted,
  Cancelled: UI_COLORS.error,
} as const;

export const CAMPAIGN_STATUS_COLORS = {
  Active: UI_COLORS.success,
  Completed: UI_COLORS.primary,
  Abandoned: UI_COLORS.textMuted,
} as const;
