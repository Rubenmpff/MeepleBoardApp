import { COLORS } from "@/src/constants/colors";

// Shared visual language, first established on Home.
export const APP_THEME = {
  colors: {
    background: COLORS.background, card: COLORS.card, text: COLORS.onBackground,
    muted: "#52616B", primary: "#1565C0", primarySoft: "#EAF2FC", onPrimary: "#FFFFFF",
    session: "#8A4600", sessionSoft: "#FFF3DE", library: "#286C2C", librarySoft: "#EDF6EE",
    campaign: COLORS.campaign, campaignSoft: "#F4EDF8", journal: "#00695C", journalSoft: "#E7F3EF",
    border: "#DFE5E9",
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { small: 12, card: 20 },
  text: {
    title: { fontSize: 22, lineHeight: 30, fontWeight: "800" as const },
    section: { fontSize: 18, lineHeight: 25, fontWeight: "700" as const },
    body: { fontSize: 15, lineHeight: 22 },
    caption: { fontSize: 13, lineHeight: 19 },
  },
} as const;

// Opt-in palette: semantic status colours remain distinct from primary actions.
export const UI_COLORS = {
  ...COLORS, ...APP_THEME.colors, onBackground: APP_THEME.colors.text,
  textMuted: APP_THEME.colors.muted, surface: APP_THEME.colors.card,
  secondary: APP_THEME.colors.session, success: APP_THEME.colors.library,
};

// Bright gold fill with a contrasting outline; empty stars stay hollow.
export const RATING_COLORS = { gold: "#F5BE32", outline: "#8A6200", empty: "#52616B" } as const;
