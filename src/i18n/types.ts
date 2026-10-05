export const SUPPORTED_LANGUAGES = ["pt", "en"] as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number];

export type AppLanguagePreference =
  | SupportedLanguage
  | "system";

export function isSupportedLanguage(
  value: string | null | undefined
): value is SupportedLanguage {
  return (
    value === "pt" ||
    value === "en"
  );
}

export function isAppLanguagePreference(
  value: string | null | undefined
): value is AppLanguagePreference {
  return (
    value === "system" ||
    isSupportedLanguage(value)
  );
}