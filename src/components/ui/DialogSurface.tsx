import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_THEME as theme } from "@/src/styles/appTheme";

export default function DialogSurface({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, {
        paddingTop: insets.top + theme.space.lg, paddingBottom: insets.bottom + theme.space.lg,
      }]}>
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: theme.space.lg },
  card: { width: "100%", maxWidth: 420, backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.space.xl },
});
