// src/features/library/components/CollectionSortSheet.tsx
// Sorting only, in the common sheet; the options depend on the tab.
import { useTranslation } from "react-i18next";
import { SortSheet } from "@/src/ui/Filters";
import { SortOption } from "../utils/collectionHelpers";

type Props = { visible: boolean; options: SortOption[]; active: SortOption; onSelect: (sort: SortOption) => void; onClose: () => void };

export function CollectionSortSheet({ visible, options, active, onSelect, onClose }: Props) {
  const { t } = useTranslation("library");
  return <SortSheet visible={visible} options={options.map(key => ({ key, label: t(`ui.sort.${key}`) }))} value={active} onSelect={onSelect} onClose={onClose} />;
}
