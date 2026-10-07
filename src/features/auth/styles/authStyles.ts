import { StyleSheet } from "react-native";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { AUTH_COLORS as colors } from "./authTheme";
const body = { fontSize: 16, lineHeight: 24 };
export const AUTH_STYLES = StyleSheet.create({
  eyeIcon: { ...UI_STYLES.iconButton, marginRight: 4 },
  subtitle: { ...body, color: colors.muted, textAlign: "left" },
  forgotPassword: { ...body, color: colors.primary, textDecorationLine: "underline", flexShrink: 1 },
  rememberContainer: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  rememberText: { ...body, color: colors.text, flex: 1 },
  termsContainer: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  termsText: { ...body, color: colors.text, flex: 1 },
  link: { color: colors.primary, textDecorationLine: "underline" },
  alreadyText: { ...body, textAlign: "center", color: colors.text },
  loginLink: { color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
  backToLoginText: { ...body, color: colors.text, textAlign: "center" },
  backToLoginLink: { color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
  helper: { fontSize: 14, lineHeight: 21, color: colors.muted },
  icon: { alignSelf: "center" },
});
