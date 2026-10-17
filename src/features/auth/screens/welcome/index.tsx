import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../components/AuthLayout";
import AuthButton from "../../components/AuthButton";
import { AUTH_COLORS } from "../../styles/authTheme";
import { LEGAL_URLS } from "@/src/constants/legal";

const DOCUMENTS = [
  { key: "terms", url: LEGAL_URLS.terms },
  { key: "privacy", url: LEGAL_URLS.privacy },
  { key: "guidelines", url: LEGAL_URLS.guidelines },
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
        <View style={styles.documentLinks}>
        {DOCUMENTS.map(document => (
          <TouchableOpacity key={document.key} style={styles.documentLink} accessibilityRole="link" accessibilityLabel={t("welcome." + document.key)} onPress={() => Linking.openURL(document.url)}>
            <Text style={styles.link}>{t("welcome." + document.key)}</Text>
          </TouchableOpacity>
        ))}
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 16, lineHeight: 24, color: APP_THEME.colors.muted, textAlign: "left" },
  documents: { borderTopWidth: 1, borderTopColor: APP_THEME.colors.border, paddingTop: 12, gap: APP_THEME.space.xs },
  documentLinks: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 0 },
  documentLink: { minHeight: 44, justifyContent: "center", maxWidth: "100%", paddingVertical: 8 },
  link: { fontSize: 16, lineHeight: 24, color: APP_THEME.colors.primary, fontWeight: "600" },
});
