import { ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/src/constants/routes";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import SectionCard from "@/src/components/ui/SectionCard";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { APP_THEME } from "@/src/styles/appTheme";

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation("settings");
  return (
    <ScreenLayout title={t("profile.title")}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard style={styles.card}>
          <Text style={UI_STYLES.section}>{t("profile.preferences")}</Text>
          <Text style={styles.description}>{t("profile.description")}</Text>
          <PrimaryButton title={t("profile.settings")} icon="settings-outline" onPress={() => router.push(ROUTES.SETTINGS)} />
        </SectionCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: APP_THEME.space.lg, paddingBottom: APP_THEME.space.xxl },
  card: { gap: APP_THEME.space.lg },
  description: { ...UI_STYLES.body, color: APP_THEME.colors.muted },
});
