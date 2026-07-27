import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import pt from "./locales/pt.json";

export const LANGUAGE_STORAGE_KEY = "@meepleboard/language";

export type AppLanguage = "pt" | "en" | "system";

const resources = {
  pt: {
    translation: pt,
  },
  en: {
    translation: en,
  },
};

function getDeviceLanguage(): "pt" | "en" {
  const deviceLanguage = getLocales()[0]?.languageCode;

  return deviceLanguage === "pt" ? "pt" : "en";
}

export async function initializeLanguage(): Promise<void> {
  try {
    const savedLanguage =
      await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage === "pt" || savedLanguage === "en") {
      await i18n.changeLanguage(savedLanguage);
      return;
    }

    await i18n.changeLanguage(getDeviceLanguage());
  } catch (error) {
    console.error("Erro ao carregar o idioma:", error);
    await i18n.changeLanguage(getDeviceLanguage());
  }
}

export async function changeAppLanguage(
  language: AppLanguage
): Promise<void> {
  try {
    if (language === "system") {
      await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
      await i18n.changeLanguage(getDeviceLanguage());
      return;
    }

    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error("Erro ao alterar o idioma:", error);
    throw error;
  }
}

export async function getSavedLanguage(): Promise<AppLanguage> {
  const savedLanguage =
    await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (savedLanguage === "pt" || savedLanguage === "en") {
    return savedLanguage;
  }

  return "system";
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: "en",
  supportedLngs: ["pt", "en"],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;