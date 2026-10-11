import { APP_THEME as base, UI_COLORS as original } from "./appTheme";
import { UI_STYLES as originalStyles } from "./uiStyles";
import { colors } from "@/src/ui/theme";
// Kept for screens that import it; same palette and scale as styles/appTheme (src/ui/theme).
export const APP_THEME = { ...base, colors: { ...base.colors, border: colors.line } } as const;
export const UI_COLORS = { ...original, star: "#F5BE32" };
export const UI_STYLES = { ...originalStyles,
 card: { ...originalStyles.card, backgroundColor: colors.card, borderRadius: base.radius.card, borderColor: colors.line },
 empty: { ...base.text.body, color: colors.muted, textAlign: "center" as const },
};
