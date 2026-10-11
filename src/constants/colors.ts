import { colors } from "@/src/ui/theme";

// Legacy names kept for existing screens; values come from the single palette in src/ui/theme.
export const COLORS = {
  primary: colors.primary,
  secondary: colors.pendingText,

  background: colors.background,
  surface: colors.track,
  card: colors.card,

  onSurface: colors.primary,
  onBackground: colors.text,
  textMuted: colors.muted,

  error: colors.danger,
  success: colors.primary,

  active: colors.primary,
  inactive: colors.chevron,

  star: colors.gold,
  campaign: colors.friend,
  journal: colors.pendingIcon,

  border: colors.line,
} as const;
