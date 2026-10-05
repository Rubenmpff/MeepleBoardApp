import { COLORS } from "@/src/constants/colors";

// Home-only tokens: other features retain their existing appearance.
export const DASHBOARD_THEME = {
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
