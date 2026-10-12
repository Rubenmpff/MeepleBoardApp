import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "resource_language";

/**
 * Preferred language for game resources. Starts with the app language and is
 * kept separately, so changing it does not change the app language (and vice versa).
 * "all" shows every language.
 */
export function useResourceLanguage(appLanguage: string) {
  const fallback = appLanguage.slice(0, 2).toLowerCase() || "en";
  const [language, setLanguageState] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => { if (saved === "all" || /^[a-z]{2}$/.test(saved ?? "")) setLanguageState(saved!); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setLanguage = useCallback((next: string) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  return { language, setLanguage, loaded, appLanguage: fallback };
}
