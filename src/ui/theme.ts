import { StyleSheet } from "react-native";

// Root of the MeepleBoard palette: src/constants/colors, styles/appTheme and styles/clubTheme derive from it.
// Colour carries meaning: green = you, actions and selection; violet = the friend; lavender = the page highlight;
// soft gold = something waiting for you (to rate, answer, confirm); coral/grey-violet = losses/draws; red = risky actions only.
export const colors = {
 background: "#FBFBF8", card: "#FFFFFF", hero: "#F1EBFA", band: "#F6F2FA",
 text: "#30283D", muted: "#58616A", primary: "#27594B", primarySoft: "#E7F0E7", field: "#E1DBE7", danger: "#B3261E", dangerSoft: "#FBEAE9",
 onPrimary: "#FFFFFF", line: "#EAE5EF", hair: "#EFEAF2", heroLine: "#E3DAF0", track: "#EFEDF1", tint: "#FAF8FC",
 friend: "#7A5AAE", shared: "#A89BC4", loss: "#E46B71", draw: "#9C93AE", icon: "#9C86C9", chevron: "#8C9096", empty: "#B9B3C0", placeholder: "#6B7280",
 pendingSoft: "#FFF7DE", pendingLine: "#F1E3B5", pendingText: "#6E4D00", pendingIcon: "#8A6200", gold: "#DCA52B", scrim: "rgba(35,25,45,0.36)",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { card: 14, control: 12, hero: 16, sheet: 22 } as const;
export const touch = 44;

// Six text styles. Sizes grow with Dynamic Type; layouts reflow instead of clipping.
export const type = StyleSheet.create({
 display: { fontSize: 34, lineHeight: 40, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
 title: { fontSize: 22, lineHeight: 28, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
 head: { fontSize: 17, lineHeight: 22, fontWeight: "600", color: colors.text },
 body: { fontSize: 15, lineHeight: 20, color: colors.text },
 caption: { fontSize: 13, lineHeight: 18, color: colors.muted },
 micro: { fontSize: 12, lineHeight: 16, color: colors.muted },
});
export const strong = { fontWeight: "600" as const };
export const numeric = { fontVariant: ["tabular-nums" as const] };

// Large text switches side-by-side layouts to columns.
export const isLarge = (width: number, fontScale: number) => width < 360 || fontScale > 1.25;
