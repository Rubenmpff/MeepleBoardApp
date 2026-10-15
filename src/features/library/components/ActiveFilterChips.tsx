// src/features/library/components/ActiveFilterChips.tsx
// What is applied in the library, each removable at once (common ActiveFilters).
import { useTranslation } from "react-i18next";
import { ActiveFilter, ActiveFilters } from "@/src/ui/Filters";
import { CollectionFilters } from "../utils/collectionHelpers";

const HISTORY_LABELS = { never: "never", recent: "recent", stale: "staleShort" } as const;

export function activeFilterItems(filters: CollectionFilters, onChange: (filters: CollectionFilters) => void, t: (key: string, o?: Record<string, unknown>) => string): ActiveFilter[] {
  const items: ActiveFilter[] = [];
  if (filters.playerCount != null) items.push({ key: "players", label: t("ui.playersCount", { range: filters.playerCount === 5 ? "5+" : filters.playerCount }), onRemove: () => onChange({ ...filters, playerCount: undefined }) });
  if (filters.minBggRating != null) items.push({ key: "bgg", label: `BGG ${filters.minBggRating}+`, onRemove: () => onChange({ ...filters, minBggRating: undefined }) });
  for (const mode of filters.modes ?? []) items.push({ key: `mode-${mode}`, label: t(`ui.${mode}`), onRemove: () => {
    const modes = (filters.modes ?? []).filter(m => m !== mode); onChange({ ...filters, modes: modes.length ? modes : undefined });
  } });
  if (filters.history) items.push({ key: "history", label: t(`ui.${HISTORY_LABELS[filters.history]}`), onRemove: () => onChange({ ...filters, history: undefined }) });
  return items;
}

export function ActiveFilterChips({ filters, onChange, onClearAll }: { filters: CollectionFilters; onChange: (filters: CollectionFilters) => void; onClearAll: () => void }) {
  const { t } = useTranslation("library");
  return <ActiveFilters items={activeFilterItems(filters, onChange, t)} onClearAll={onClearAll} />;
}
