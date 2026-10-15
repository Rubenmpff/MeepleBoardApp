// src/features/games/catalog/components/GameSearchFiltersSheet.tsx
// Descobrir filters in the common sheet (a draft until «Aplicar»). Online, the server applies them to every
// result page; applySearchFilters is only for the short local list (one letter, or offline).
import { useTranslation } from "react-i18next";
import { ActiveFilter, FilterSheet, OptionGroup } from "@/src/ui/Filters";

export interface SearchFilters {
  playerCount?: number; // "vamos ser N": 1-4, ou 5 para "5+"
  minBggRating?: number; // 6, 7, 8
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {};

export function countActiveSearchFilters(f: SearchFilters): number {
  return (f.playerCount != null ? 1 : 0) + (f.minBggRating != null ? 1 : 0);
}

/** Local list only. A game without a known player count or BGG rating is left out of that filter, never treated as a match. */
export function applySearchFilters<T extends { minPlayers?: number; maxPlayers?: number; averageRating?: number }>(items: T[], filters: SearchFilters): T[] {
  return items.filter(g => {
    if (filters.playerCount != null) {
      if (g.minPlayers == null && g.maxPlayers == null) return false;
      const min = g.minPlayers ?? g.maxPlayers!;
      const max = g.maxPlayers ?? g.minPlayers!;
      const target = filters.playerCount;
      if (!(target === 5 ? max >= 5 : target >= min && target <= max)) return false;
    }
    if (filters.minBggRating != null && !(g.averageRating && g.averageRating >= filters.minBggRating)) return false;
    return true;
  });
}

export function searchFilterItems(filters: SearchFilters, onChange: (filters: SearchFilters) => void, t: (key: string, o?: Record<string, unknown>) => string): ActiveFilter[] {
  const items: ActiveFilter[] = [];
  if (filters.playerCount != null) items.push({ key: "players", label: t("ui.playersCount", { range: filters.playerCount === 5 ? "5+" : filters.playerCount }), onRemove: () => onChange({ ...filters, playerCount: undefined }) });
  if (filters.minBggRating != null) items.push({ key: "bgg", label: `BGG ${filters.minBggRating}+`, onRemove: () => onChange({ ...filters, minBggRating: undefined }) });
  return items;
}

type Props = { visible: boolean; filters: SearchFilters; onApply: (f: SearchFilters) => void; onClose: () => void };

export function GameSearchFiltersSheet({ visible, filters, onApply, onClose }: Props) {
  const { t } = useTranslation("games");
  return <FilterSheet visible={visible} value={filters} empty={EMPTY_SEARCH_FILTERS} onApply={onApply} onClose={onClose} activeCount={countActiveSearchFilters}>
    {(draft, setDraft) => <>
      <OptionGroup title={t("library:ui.weArePlayers")} options={[1, 2, 3, 4, 5].map(n => ({ key: n, label: n === 5 ? "5+" : String(n) }))}
        selected={draft.playerCount != null ? [draft.playerCount] : []} onChange={next => setDraft({ ...draft, playerCount: next[0] })} />
      <OptionGroup title={t("ui.minRating")} options={[6, 7, 8].map(n => ({ key: n, label: `${n}+` }))}
        selected={draft.minBggRating != null ? [draft.minBggRating] : []} onChange={next => setDraft({ ...draft, minBggRating: next[0] })} />
    </>}
  </FilterSheet>;
}
