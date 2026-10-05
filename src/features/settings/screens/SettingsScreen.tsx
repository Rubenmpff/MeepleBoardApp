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

import { COLORS } from "@/src/constants/colors";
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
  { value: LibraryPrivacy.Private, label: "Privada", description: "Só tu vês a tua coleção." },
  { value: LibraryPrivacy.FriendsOnly, label: "Apenas amigos", description: "Só amigos aceites veem a tua coleção." },
  { value: LibraryPrivacy.Public, label: "Pública", description: "Qualquer utilizador pode ver a tua coleção." },
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
      Alert.alert(tCommon("error"), "Não foi possível alterar a privacidade da coleção.");
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>
        {t("title")}
      </Text>

      <Text style={styles.subtitle}>
        {t("subtitle")}
      </Text>

      <View style={styles.languageSection}>
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
      </View>

      <View style={styles.languageSection}>
        <Text style={styles.sectionTitle}>
          Privacidade da coleção
        </Text>

        <Text style={styles.sectionDescription}>
          Quem pode ver os jogos que tens na tua coleção.
        </Text>

        <View style={styles.languageOptions}>
          {PRIVACY_OPTIONS.map((option) => {
            const isSelected = libraryPrivacy === option.value;

            return (
              <TouchableOpacity
                key={option.value}
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
                    {option.label}
                  </Text>
                  <Text style={styles.privacyOptionDescription}>{option.description}</Text>
                </View>

                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push(ROUTES.HOME)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {t("backToDashboard")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        style={[
          styles.button,
          styles.logoutButton,
        ]}
      >
        <Text style={styles.buttonText}>
          {t("logout.button")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  languageSection: {
    width: "100%",
    maxWidth: 420,
    marginTop: 32,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  sectionDescription: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  languageOptions: {
    gap: 10,
  },

  languageOption: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  languageOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}12`,
  },

  disabledOption: {
    opacity: 0.65,
  },

  languageOptionText: {
    fontSize: 16,
    color: COLORS.onBackground,
  },

  privacyOptionText: {
    flex: 1,
    marginRight: 12,
  },

  privacyOptionDescription: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textMuted,
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
    width: "100%",
    maxWidth: 420,
    minHeight: 52,
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  logoutButton: {
    marginTop: 12,
    backgroundColor: COLORS.error,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});