import { StyleSheet } from "react-native";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { UI_COLORS } from "@/src/styles/appTheme";

export const AUTH_STYLES = StyleSheet.create({
  eyeIcon: { ...UI_STYLES.iconButton, marginRight: 4 },
  subtitle: { ...UI_STYLES.body, color: UI_COLORS.textMuted, textAlign: "center" },
  forgotPassword: { ...UI_STYLES.body, color: UI_COLORS.primary, textAlign: "right" },
  rememberContainer: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  rememberText: { ...UI_STYLES.body, color: UI_COLORS.onBackground, flex: 1 },
  termsContainer: { minHeight: 44, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  termsText: { ...UI_STYLES.body, color: UI_COLORS.onBackground, flex: 1 },
  link: { color: UI_COLORS.onBackground },
  alreadyText: { ...UI_STYLES.body, textAlign: "center", color: UI_COLORS.onBackground },
  loginLink: { color: UI_COLORS.primary, fontWeight: "700" },
  backToLoginText: { ...UI_STYLES.body, color: UI_COLORS.onBackground, textAlign: "center" },
  backToLoginLink: { color: UI_COLORS.primary, fontWeight: "700" },
  icon: { alignSelf: "center" },
});
