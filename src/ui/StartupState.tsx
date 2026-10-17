import { Image, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { APP_THEME } from "@/src/styles/appTheme";
import ScreenState from "./ScreenState";

export default function StartupState({ redirecting = false }: { redirecting?: boolean }) {
  const { t } = useTranslation("navigation");
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={require("@/assets/MeepleBoardLogo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="MeepleBoard" />
        <ScreenState loading message={t(redirecting ? "startup.redirecting" : "startup.loading")} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_THEME.colors.background },
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: APP_THEME.space.lg },
  logo: { width: 160, maxWidth: "100%", height: 100 },
});
