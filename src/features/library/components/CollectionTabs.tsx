// src/features/library/components/CollectionTabs.tsx
import { useTranslation } from "react-i18next";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { FilterChips } from "@/src/ui/components";

export type CollectionTab = "ALL" | GameLibraryStatus.Owned | GameLibraryStatus.Wishlist | "PLAYED";
type CountKey = "total" | "owned" | "wishlist" | "played";

const TABS: { value: CollectionTab; label: string; count: CountKey }[] = [
  { value: "ALL", label: "all", count: "total" },
  { value: GameLibraryStatus.Owned, label: "owned", count: "owned" },
  { value: GameLibraryStatus.Wishlist, label: "wanted", count: "wishlist" },
  { value: "PLAYED", label: "playedTab", count: "played" },
];

// Status filters with their counts: the summary and the filter are the same control.
export function CollectionTabs({ active, onChange, counts }: { active: CollectionTab; onChange: (tab: CollectionTab) => void; counts?: Partial<Record<CountKey, number>> }) {
  const { t: uiT } = useTranslation("library");
  const key = (tab: CollectionTab) => String(tab);
  return <FilterChips items={TABS.map(tab => ({ key: key(tab.value), label: uiT(`ui.${tab.label}`), count: counts?.[tab.count] }))}
    value={key(active)} onChange={value => onChange(TABS.find(tab => key(tab.value) === value)!.value)} />;
}
