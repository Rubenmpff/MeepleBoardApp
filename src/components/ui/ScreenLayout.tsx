import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { APP_THEME } from "@/src/styles/appTheme";

export default function ScreenLayout({ title, children, keyboard = false, mode = "back", onCancel }: {
  title: string; children: ReactNode; keyboard?: boolean; mode?: "root" | "back" | "cancel"; onCancel?: () => void;
}) {
  const { t } = useTranslation("matches");
  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader mode={mode} onLeftPress={onCancel} title={title} appearance="refresh" leftAccessibilityLabel={mode === "cancel" ? undefined : t("ui.back")} />
      {keyboard ? (
        <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          {children}
        </KeyboardAvoidingView>
      ) : <View style={styles.body}>{children}</View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_THEME.colors.background },
  body: { flex: 1 },
});
