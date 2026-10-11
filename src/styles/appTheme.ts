import { COLORS } from "@/src/constants/colors";
import { colors, radius, space } from "@/src/ui/theme";

// Shared visual language; values come from src/ui/theme so every screen uses one palette and type scale.
export const APP_THEME = {
  colors: {
    background: colors.background, card: colors.card, text: colors.text,
    muted: colors.muted, primary: colors.primary, primarySoft: colors.primarySoft, onPrimary: colors.onPrimary,
    session: "#5B4A80", sessionSoft: "#EEE9F6", library: colors.primary, librarySoft: colors.primarySoft,
    campaign: colors.friend, campaignSoft: colors.hero, journal: colors.pendingText, journalSoft: colors.pendingSoft,
    border: colors.line, hero: colors.hero,
  },
  space: { xs: space.xs, sm: space.sm, md: space.md, lg: space.lg, xl: space.xl, xxl: 32 },
  radius: { small: radius.control, card: radius.card },
  text: {
    title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
    section: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
    body: { fontSize: 15, lineHeight: 20 },
    caption: { fontSize: 13, lineHeight: 18 },
  },
} as const;

// Opt-in palette: semantic status colours remain distinct from primary actions.
export const UI_COLORS = {
  ...COLORS, ...APP_THEME.colors, onBackground: APP_THEME.colors.text,
  textMuted: APP_THEME.colors.muted, surface: APP_THEME.colors.card,
  secondary: APP_THEME.colors.session, success: APP_THEME.colors.library,
};

// Bright gold fill with a contrasting outline; empty stars stay hollow.
export const RATING_COLORS = { gold: "#F5BE32", outline: "#8A6200", empty: colors.muted } as const;
