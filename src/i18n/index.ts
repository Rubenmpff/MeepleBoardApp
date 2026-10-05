import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import {
  initReactI18next,
} from "react-i18next";

import ptCommon from "./locales/pt/common.json";
import ptNavigation from "./locales/pt/navigation.json";
import ptSettings from "./locales/pt/settings.json";
import ptDashboard from "./locales/pt/dashboard.json";
import ptAuth from "./locales/pt/auth.json";
import ptGames from "./locales/pt/games.json";
import ptMatches from "./locales/pt/matches.json";
import ptLibrary from "./locales/pt/library.json";
import ptCampaigns from "./locales/pt/campaigns.json";
import ptFriends from "./locales/pt/friends.json";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enSettings from "./locales/en/settings.json";
import enDashboard from "./locales/en/dashboard.json";
import enAuth from "./locales/en/auth.json";
import enGames from "./locales/en/games.json";
import enMatches from "./locales/en/matches.json";
import enLibrary from "./locales/en/library.json";
import enCampaigns from "./locales/en/campaigns.json";
import enFriends from "./locales/en/friends.json";

const LANGUAGE_STORAGE_KEY =
  "@meepleboard:language";

export type AppLanguage =
  | "pt"
  | "en"
  | "system";

const resources = {
  pt: {
    common: ptCommon,
    navigation: ptNavigation,
    settings: ptSettings,
    dashboard: ptDashboard,
    auth: ptAuth,
    games: ptGames,
    matches: ptMatches,
    library: ptLibrary,
    campaigns: ptCampaigns,
    friends: ptFriends,
  },

  en: {
    common: enCommon,
    navigation: enNavigation,
    settings: enSettings,
    dashboard: enDashboard,
    auth: enAuth,
    games: enGames,
    matches: enMatches,
    library: enLibrary,
    campaigns: enCampaigns,
    friends: enFriends,
  },
} as const;

function normalizeLanguage(
  language?: string | null
): "pt" | "en" {
  const normalized =
    language
      ?.trim()
      .toLowerCase()
      .split("-")[0] ?? "";

  return normalized === "pt"
    ? "pt"
    : "en";
}

export function getSystemLanguage():
  | "pt"
  | "en" {
  const locales =
    Localization.getLocales();

  const primaryLanguage =
    locales[0]?.languageCode ??
    locales[0]?.languageTag ??
    "en";

  return normalizeLanguage(
    primaryLanguage
  );
}

export async function getStoredLanguage():
  Promise<AppLanguage> {
  try {
    const storedLanguage =
      await AsyncStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (
      storedLanguage === "pt" ||
      storedLanguage === "en"
    ) {
      return storedLanguage;
    }

    return "system";
  } catch (error) {
    console.error(
      "❌ Failed to read language preference:",
      error
    );

    return "system";
  }
}

export async function initializeLanguage():
  Promise<"pt" | "en"> {
  const storedLanguage =
    await getStoredLanguage();

  const resolvedLanguage =
    storedLanguage === "system"
      ? getSystemLanguage()
      : storedLanguage;

  if (
    i18n.language !== resolvedLanguage
  ) {
    await i18n.changeLanguage(
      resolvedLanguage
    );
  }

  return resolvedLanguage;
}

export async function changeAppLanguage(
  language: AppLanguage
): Promise<"pt" | "en"> {
  try {
    if (language === "system") {
      await AsyncStorage.removeItem(
        LANGUAGE_STORAGE_KEY
      );

      const systemLanguage =
        getSystemLanguage();

      await i18n.changeLanguage(
        systemLanguage
      );

      return systemLanguage;
    }

    await AsyncStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      language
    );

    await i18n.changeLanguage(language);

    return language;
  } catch (error) {
    console.error(
      "❌ Failed to change language:",
      error
    );

    const fallbackLanguage =
      getSystemLanguage();

    await i18n.changeLanguage(
      fallbackLanguage
    );

    return fallbackLanguage;
  }
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,

      lng: "pt",
      fallbackLng: "en",

      defaultNS: "common",

      supportedLngs: [
        "pt",
        "en",
      ],

      interpolation: {
        escapeValue: false,
      },

      compatibilityJSON: "v4",

      returnNull: false,

      react: {
        useSuspense: false,
      },
    });
}

export {
  LANGUAGE_STORAGE_KEY,
};

export default i18n;