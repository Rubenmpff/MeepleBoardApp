import { StyleSheet } from "react-native";
import { APP_THEME as theme } from "./appTheme";

export const UI_STYLES = StyleSheet.create({
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border },
  title: { ...theme.text.title, color: theme.colors.text },
  section: { ...theme.text.section, color: theme.colors.text },
  body: { ...theme.text.body },
  caption: { ...theme.text.caption },
  muted: { ...theme.text.caption, color: theme.colors.muted },
  empty: { ...theme.text.body, color: theme.colors.muted, textAlign: "center" },
  button: { minHeight: 52, borderRadius: theme.radius.small, paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, alignItems: "center", justifyContent: "center" },
  control: { minHeight: 44, borderRadius: theme.radius.small, justifyContent: "center" },
  iconButton: { width: 44, height: 44, borderRadius: theme.radius.small, alignItems: "center", justifyContent: "center" },
  field: { ...theme.text.body, minHeight: 52, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.small, backgroundColor: theme.colors.card, color: theme.colors.text, paddingHorizontal: theme.space.md, paddingVertical: theme.space.md },
});
