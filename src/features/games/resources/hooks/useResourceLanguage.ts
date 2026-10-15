import { useAccountPreference } from "@/src/shared/hooks/useAccountMemory";

/**
 * Preferred language for game resources, saved on the device for the signed-in account. Starts with the
 * app language and is kept separately, so changing it does not change the app language (and vice versa).
 * "all" shows every language.
 */
export function useResourceLanguage(appLanguage: string) {
  const fallback = appLanguage.slice(0, 2).toLowerCase() || "en";
  const { value: language, setValue: setLanguage, loaded } = useAccountPreference<string>("resource-language", fallback, v => v === "all" || /^[a-z]{2}$/.test(v), "resource_language");
  return { language, setLanguage, loaded, appLanguage: fallback };
}
