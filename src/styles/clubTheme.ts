import { APP_THEME as base, UI_COLORS as original } from "./appTheme";
import { UI_STYLES as originalStyles } from "./uiStyles";
// Opt-in for Home and Library only. Authentication and all other screens stay unchanged.
export const APP_THEME = { ...base, colors: { ...base.colors,
 background: "#FBFBF8", card: "#FFFFFF", hero: "#F1EBFA", text: "#30283D", muted: "#58616A",
 primary: "#27594B", primarySoft: "#E7F0E7", border: "#89938F", journal: "#8A6200", journalSoft: "#FFF7DE",
}, radius: { small: 12, card: 16 }, text: { ...base.text,
 title: { fontSize: 22, lineHeight: 30, fontWeight: "700" as const }, body: { fontSize: 16, lineHeight: 24 },
}} as const;
export const UI_COLORS = { ...original, ...APP_THEME.colors,
 onBackground: APP_THEME.colors.text, textMuted: APP_THEME.colors.muted, surface: APP_THEME.colors.card,
 star: "#F5BE32", secondary: original.secondary, success: original.success,
};
export const UI_STYLES = { ...originalStyles,
 card: { ...originalStyles.card, backgroundColor: UI_COLORS.card, borderRadius: 16, borderColor: UI_COLORS.border },
 title: { ...APP_THEME.text.title, color: UI_COLORS.text }, section: { ...APP_THEME.text.section, color: UI_COLORS.text },
 body: APP_THEME.text.body, muted: { ...APP_THEME.text.caption, color: UI_COLORS.muted },
 empty: { ...APP_THEME.text.body, color: UI_COLORS.muted, textAlign: "center" as const },
 field: { ...originalStyles.field, ...APP_THEME.text.body, backgroundColor: UI_COLORS.card, color: UI_COLORS.text, borderColor: UI_COLORS.border },
};
