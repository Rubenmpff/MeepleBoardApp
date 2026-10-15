// src/features/library/components/CollectionFiltersSheet.tsx
// Library filters in the common sheet: a draft until «Aplicar», with the result count of that draft.
import { useTranslation } from "react-i18next";
import { FilterSheet, OptionGroup } from "@/src/ui/Filters";
import { applyFilters, CollectionEntry, CollectionFilters, countActiveFilters, EMPTY_FILTERS, HistoryFilter, ModeFilter } from "../utils/collectionHelpers";

type Props = {
  visible: boolean;
  filters: CollectionFilters;
  /** The games of the current tab and search: the draft is counted against them. */
  entries: CollectionEntry[];
  onApply: (filters: CollectionFilters) => void;
  onClose: () => void;
};

export function CollectionFiltersSheet({ visible, filters, entries, onApply, onClose }: Props) {
  const { t } = useTranslation("library");
  return <FilterSheet visible={visible} value={filters} empty={EMPTY_FILTERS} onApply={onApply} onClose={onClose}
    activeCount={countActiveFilters} resultCount={draft => applyFilters(entries, draft).length}>
    {(draft, setDraft) => <>
      <OptionGroup title={t("ui.weArePlayers")} options={[1, 2, 3, 4, 5].map(n => ({ key: n, label: n === 5 ? "5+" : String(n) }))}
        selected={draft.playerCount != null ? [draft.playerCount] : []} onChange={next => setDraft({ ...draft, playerCount: next[0] })} />
      <OptionGroup title={t("ui.minRating")} options={[7, 8, 9].map(n => ({ key: n, label: `${n}+` }))}
        selected={draft.minBggRating != null ? [draft.minBggRating] : []} onChange={next => setDraft({ ...draft, minBggRating: next[0] })} />
      <OptionGroup<ModeFilter> multi title={t("ui.modes")} options={[{ key: "cooperative", label: t("ui.cooperative") }, { key: "solo", label: t("ui.solo") }]}
        selected={draft.modes ?? []} onChange={next => setDraft({ ...draft, modes: next.length ? next : undefined })} />
      <OptionGroup<HistoryFilter> title={t("ui.history")} options={[{ key: "never", label: t("ui.never") }, { key: "recent", label: t("ui.recent") }, { key: "stale", label: t("ui.stale") }]}
        selected={draft.history ? [draft.history] : []} onChange={next => setDraft({ ...draft, history: next[0] })} />
    </>}
  </FilterSheet>;
}
