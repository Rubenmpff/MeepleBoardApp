import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../components/AuthLayout";
import AuthButton from "../../components/AuthButton";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { AUTH_COLORS } from "../../styles/authTheme";

const DOCUMENTS = [
  { key: "terms", url: "https://meepleboard.com/terms" },
  { key: "privacy", url: "https://meepleboard.com/privacy" },
  { key: "guidelines", url: "https://meepleboard.com/guidelines" },
] as const;

const APP_THEME = { colors: AUTH_COLORS, space: { xs: 4, lg: 16 } };

export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  return (
    <AuthLayout title={t("welcome.title")}>
      <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
      <AuthButton title={t("welcome.login")} onPress={() => router.push("/signin")} />
      <AuthButton variant="secondary" title={t("welcome.signUp")} onPress={() => router.push("/signup")} />
      <View style={styles.documents}>
        <Text style={styles.subtitle}>{t("welcome.termsIntro")}</Text>
        {DOCUMENTS.map(document => (
          <TouchableOpacity key={document.key} style={UI_STYLES.control} accessibilityRole="link" accessibilityLabel={t("welcome." + document.key)} onPress={() => Linking.openURL(document.url)}>
            <Text style={styles.link}>{t("welcome." + document.key)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 16, lineHeight: 24, color: APP_THEME.colors.muted, textAlign: "left" },
  documents: { borderTopWidth: 1, borderTopColor: APP_THEME.colors.border, paddingTop: APP_THEME.space.lg, gap: APP_THEME.space.xs },
  link: { fontSize: 16, lineHeight: 24, color: APP_THEME.colors.primary, fontWeight: "600" },
});
