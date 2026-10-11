import { colors } from "@/src/ui/theme";

// Authentication palette: shared values come from the app theme; the rest are
// specific to the sign-in screens (darker field borders and switch track, decoration).
export const AUTH_COLORS = {
  background: colors.background, hero: colors.hero, mint: colors.primarySoft,
  text: colors.text, muted: colors.muted, primary: colors.primary, onPrimary: colors.onPrimary,
  switchOff: "#68736F", field: colors.card, border: "#89938F", error: "#A52C38", errorSoft: "#FFF0F1",
  inactive: "#E3E9E5", decoration: "#A3BEAE", decorationStrong: "#83A997",
} as const;
