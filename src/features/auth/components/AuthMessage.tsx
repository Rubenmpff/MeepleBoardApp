import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { AUTH_COLORS } from "../styles/authTheme";
const UI_COLORS = { error: AUTH_COLORS.error, success: AUTH_COLORS.primary, librarySoft: AUTH_COLORS.mint };

export default function AuthMessage({ children, variant = "error" }: { children: ReactNode; variant?: "error" | "success" }) {
  const success = variant === "success";
  return (
    <View style={[styles.box, success && styles.success]}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.text, success && styles.successText]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: UI_COLORS.error, backgroundColor: "#FFF1F1" },
  success: { borderColor: UI_COLORS.success, backgroundColor: UI_COLORS.librarySoft },
  text: { ...UI_STYLES.body, color: UI_COLORS.error, fontWeight: "600" },
  successText: { color: UI_COLORS.success },
});
