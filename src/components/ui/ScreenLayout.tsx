import { createContext, ReactNode, useContext } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { colors } from "@/src/ui/theme";

// Inside a hub (e.g. Jogar) a screen shows only its content; the hub owns the header and safe area.
export const EmbeddedScreen = createContext(false);

export default function ScreenLayout({ title, children, keyboard = false, mode = "back", onCancel }: {
  title: string; children: ReactNode; keyboard?: boolean; mode?: "root" | "back" | "cancel"; onCancel?: () => void;
}) {
  const { t } = useTranslation("matches");
  const embedded = useContext(EmbeddedScreen);
  if (embedded) return <View style={styles.body}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}><ScreenHeader mode={mode} onLeftPress={onCancel} title={title} leftAccessibilityLabel={mode === "cancel" ? undefined : t("ui.back")} /></View>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          {children}
        </KeyboardAvoidingView>
      ) : <View style={styles.body}>{children}</View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16 },
  body: { flex: 1 },
});
