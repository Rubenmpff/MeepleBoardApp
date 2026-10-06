import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import SectionCard from "@/src/components/ui/SectionCard";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { ROUTES } from "@/src/constants/routes";
import { authService } from "@/src/features/auth/services/authService";
import {
  AppLanguage,
  changeAppLanguage,
  getStoredLanguage,
} from "@/src/i18n";
import { getCurrentUser, updateLibraryPrivacy } from "@/src/features/users/services/userService";
import { LibraryPrivacy } from "@/src/features/users/types/User";

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
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >

        <Text style={styles.subtitle}>
          {t("subtitle")}
        </Text>

        <SectionCard style={styles.languageSection}>
          <Text style={styles.sectionTitle}>
            {t("language.title")}
          </Text>

          <Text style={styles.sectionDescription}>
            {t("language.description")}
          </Text>

          <View style={styles.languageOptions}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected =
                selectedLanguage === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  accessibilityLabel={t(option.translationKey)}
                  activeOpacity={0.8}
                  disabled={isChangingLanguage}
                  onPress={() =>
                    handleLanguageChange(option.value)
                  }
                  style={[
                    styles.languageOption,
                    isSelected &&
                    styles.languageOptionSelected,
                    isChangingLanguage &&
                    styles.disabledOption,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: isSelected,
                    disabled: isChangingLanguage,
                  }}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      isSelected &&
                      styles.languageOptionTextSelected,
                    ]}
                  >
                    {t(option.translationKey)}
                  </Text>

                  <View
                    style={[
                      styles.radioOuter,
                      isSelected &&
                      styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard style={styles.languageSection}>
          <Text style={styles.sectionTitle}>
            {t("privacy.title")}
          </Text>

          <Text style={styles.sectionDescription}>
            {t("privacy.description")}
          </Text>

          <View style={styles.languageOptions}>
            {PRIVACY_OPTIONS.map((option) => {
              const isSelected = libraryPrivacy === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  accessibilityLabel={t(option.label)} accessibilityHint={t(option.description)}
                  activeOpacity={0.8}
                  disabled={isChangingPrivacy}
                  onPress={() => handlePrivacyChange(option.value)}
                  style={[
                    styles.languageOption,
                    isSelected && styles.languageOptionSelected,
                    isChangingPrivacy && styles.disabledOption,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, disabled: isChangingPrivacy }}
                >
                  <View style={styles.privacyOptionText}>
                    <Text style={[styles.languageOptionText, isSelected && styles.languageOptionTextSelected]}>
                      {t(option.label)}
                    </Text>
                    <Text style={styles.privacyOptionDescription}>{t(option.description)}
                    </Text>
                  </View>

                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>


        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel={t("logout.button")} onPress={handleLogout}
          style={[
            styles.button,
            styles.logoutButton,
          ]}
        >
          <Text style={styles.buttonText}>
            {t("logout.button")}
          </Text>
        </TouchableOpacity>
      </ScrollView></ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: { padding: 16, paddingBottom: 32, gap: 16 },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  subtitle: {
    ...UI_STYLES.body, color: COLORS.textMuted
  },

  languageSection: { gap: 8 },

  sectionTitle: {
    ...UI_STYLES.section
  },

  sectionDescription: {
    ...UI_STYLES.body, color: COLORS.textMuted, marginBottom: 8
  },

  languageOptions: {
    gap: 10,
  },

  languageOption: {
    ...UI_STYLES.field, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12
  },

  languageOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },

  disabledOption: {
    opacity: 0.65,
  },

  languageOptionText: {
    ...UI_STYLES.body, flexShrink: 1, color: COLORS.onBackground
  },

  privacyOptionText: {
    flex: 1,
    marginRight: 12,
  },

  privacyOptionDescription: {
    ...UI_STYLES.muted, marginTop: 4
  },

  languageOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  button: {
    ...UI_STYLES.button, width: "100%"
  },

  logoutButton: { backgroundColor: COLORS.error },

  buttonText: {
    ...UI_STYLES.body, color: COLORS.onPrimary, fontWeight: "700"
  },
});
