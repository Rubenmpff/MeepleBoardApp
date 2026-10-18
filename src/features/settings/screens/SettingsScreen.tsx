import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import ScreenLayout from "@/src/ui/ScreenLayout";
import { Card, Note, Row, Section } from "@/src/ui/components";
import { colors, space, type } from "@/src/ui/theme";
import { authService } from "@/src/features/auth/services/authService";
import {
  AppLanguage,
  changeAppLanguage,
  getStoredLanguage,
} from "@/src/i18n";
import { getCurrentUser, updateDurationSharing, updateLibraryPrivacy } from "@/src/features/users/services/userService";
import { LibraryPrivacy } from "@/src/features/users/types/User";
import { forgetAccountMemory } from "@/src/shared/hooks/useAccountMemory";


type LanguageOption = {
  value: AppLanguage;
  translationKey:
  | "language.system"
  | "language.portuguese"
  | "language.english";
};

const PRIVACY_OPTIONS: { value: LibraryPrivacy; label: string; description: string }[] = [
  { value: LibraryPrivacy.Private, label: "privacy.private", description: "privacy.privateDescription" },
  { value: LibraryPrivacy.FriendsOnly, label: "privacy.friends", description: "privacy.friendsDescription" },
  { value: LibraryPrivacy.Public, label: "privacy.public", description: "privacy.publicDescription" },
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: "system",
    translationKey: "language.system",
  },
  {
    value: "pt",
    translationKey: "language.portuguese",
  },
  {
    value: "en",
    translationKey: "language.english",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");

  const [selectedLanguage, setSelectedLanguage] =
    useState<AppLanguage>("system");

  const [isChangingLanguage, setIsChangingLanguage] =
    useState(false);

  const [libraryPrivacy, setLibraryPrivacy] =
    useState<LibraryPrivacy | null>(null);

  const [isChangingPrivacy, setIsChangingPrivacy] =
    useState(false);

  // Contribution to community duration statistics: off by default, changed only by this account.
  const [sharesDurations, setSharesDurations] = useState<boolean | null>(null);
  const [isChangingSharing, setIsChangingSharing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPreference() {
      const preference = await getStoredLanguage();

      if (isMounted) {
        setSelectedLanguage(preference);
      }
    }

    async function loadPrivacy() {
      try {
        const me = await getCurrentUser();
        if (isMounted) {
          setLibraryPrivacy(me.libraryPrivacy ?? LibraryPrivacy.Public);
          setSharesDurations(me.contributesDurationStats ?? false);
        }
      } catch (error) {
        console.error("Erro ao carregar a privacidade da coleção:", error);
      }
    }

    void loadPreference();
    void loadPrivacy();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handlePrivacyChange(privacy: LibraryPrivacy) {
    if (isChangingPrivacy || privacy === libraryPrivacy) return;

    const previous = libraryPrivacy;
    setLibraryPrivacy(privacy);
    setIsChangingPrivacy(true);

    try {
      await updateLibraryPrivacy(privacy);
    } catch (error) {
      console.error("Erro ao alterar a privacidade da coleção:", error);
      setLibraryPrivacy(previous ?? null);
      Alert.alert(tCommon("error"), t("privacy.changeError"));
    } finally {
      setIsChangingPrivacy(false);
    }
  }

  async function handleSharingChange(enabled: boolean) {
    if (isChangingSharing || sharesDurations === null || enabled === sharesDurations) return;
    setSharesDurations(enabled);
    setIsChangingSharing(true);
    try {
      await updateDurationSharing(enabled);
    } catch (error) {
      console.error("Erro ao alterar a contribuição para as durações:", error);
      setSharesDurations(!enabled);
      Alert.alert(tCommon("error"), t("durationSharing.changeError"));
    } finally {
      setIsChangingSharing(false);
    }
  }

  async function handleLanguageChange(
    language: AppLanguage
  ) {
    if (
      isChangingLanguage ||
      language === selectedLanguage
    ) {
      return;
    }

    const previousLanguage = selectedLanguage;

    setSelectedLanguage(language);
    setIsChangingLanguage(true);

    try {
      await changeAppLanguage(language);
    } catch (error) {
      console.error(
        "Erro ao alterar o idioma:",
        error
      );

      setSelectedLanguage(previousLanguage);

      Alert.alert(
        tCommon("error"),
        t("language.changeError")
      );
    } finally {
      setIsChangingLanguage(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      t("logout.title"),
      t("logout.confirmation"),
      [
        {
          text: tCommon("cancel"),
          style: "cancel",
        },
        {
          text: t("logout.button"),
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
              // Filters, searches and positions kept for this session are not carried to the next account.
              forgetAccountMemory();
              router.replace("/welcome");
            } catch (error) {
              console.error(
                "Erro ao terminar sessão:",
                error
              );

              Alert.alert(
                tCommon("error"),
                t("logout.error")
              );
            }
          },
        },
      ]
    );
  }

  return (
    <ScreenLayout title={t("title")}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Section title={t("language.title")}>
          <Card>
            {LANGUAGE_OPTIONS.map((option, index) => <Row key={option.value} first={index === 0} end="check"
              selected={selectedLanguage === option.value} title={t(option.translationKey)} accessibilityLabel={t(option.translationKey)}
              onPress={() => handleLanguageChange(option.value)} />)}
          </Card>
          <Note inset>{t("language.description")}</Note>
        </Section>

        <Section title={t("privacy.title")}>
          <Card>
            {PRIVACY_OPTIONS.map((option, index) => <Row key={option.value} first={index === 0} end="check"
              selected={libraryPrivacy === option.value} title={t(option.label)} subtitle={t(option.description)}
              accessibilityLabel={t(option.label)} accessibilityHint={t(option.description)}
              onPress={() => handlePrivacyChange(option.value)} />)}
          </Card>
          <Note inset>{t("privacy.description")}</Note>
        </Section>

        <Section title={t("community.title")}>
          <Card>
            <Row first title={t("community.blocked")} accessibilityLabel={t("community.blocked")} onPress={() => router.push("/settings/blocked" as never)} />
          </Card>
        </Section>

        <Section title={t("durationSharing.title")}>
          <Card>
            {/* The whole row toggles, so the touch target is the row, not only the 51 × 31 switch. */}
            <TouchableOpacity style={styles.switchRow} accessibilityRole="switch" accessibilityLabel={t("durationSharing.label")}
              accessibilityState={{ checked: !!sharesDurations, disabled: sharesDurations === null || isChangingSharing }}
              disabled={sharesDurations === null || isChangingSharing} onPress={() => handleSharingChange(!sharesDurations)}>
              <View style={styles.switchText}>
                <Text style={type.body}>{t("durationSharing.label")}</Text>
                <Text style={type.caption}>{t(sharesDurations ? "durationSharing.on" : "durationSharing.off")}</Text>
              </View>
              <Switch value={!!sharesDurations} onValueChange={handleSharingChange} disabled={sharesDurations === null || isChangingSharing}
                accessible={false} importantForAccessibility="no" trackColor={{ true: colors.primary, false: colors.track }} />
            </TouchableOpacity>
          </Card>
          <Card padded>
            <View style={styles.explain}>
              {(["used", "never", "when", "how", "offEffect"] as const).map(key => <Text key={key} style={type.caption}>{t(`durationSharing.${key}`)}</Text>)}
            </View>
          </Card>
        </Section>

        <Section>
          <Card>
            <Row first title={t("logout.button")} tone="danger" end="none" accessibilityLabel={t("logout.button")} onPress={handleLogout} />
            <Row title={t("deleteAccount.title")} tone="danger" end="none" accessibilityLabel={t("deleteAccount.title")} onPress={() => router.push("/settings/delete-account" as never)} />
          </Card>
        </Section>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: space.lg, paddingTop: space.xs, paddingBottom: 32, gap: space.xl },
  switchRow: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 64, paddingHorizontal: space.lg, paddingVertical: space.sm },
  switchText: { flex: 1, minWidth: 0, gap: 2 },
  explain: { gap: space.sm },
});
