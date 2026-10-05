import { TFunction } from "i18next";

// Keep the existing thresholds; only the language of the display changes.
export function translatedRelativeDate(dateStr: string | undefined, t: TFunction): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return t("ui.today");
  if (days === 1) return t("ui.yesterday");
  if (days < 30) return t("ui.days", { count: days });
  if (days < 365) return t("ui.months", { count: Math.floor(days / 30) });
  return t("ui.years", { count: Math.floor(days / 365) });
}
