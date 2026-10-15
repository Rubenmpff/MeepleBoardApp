// src/features/games/catalog/components/GameSearchSortSheet.tsx
// Sorting only, in the common sheet.
import { useTranslation } from "react-i18next";
import { SortSheet } from "@/src/ui/Filters";

export type SearchSortOption = "relevance" | "most_known" | "bgg_rating" | "year_desc" | "name_asc";

export const SEARCH_SORT_LABELS: Record<SearchSortOption, string> = {
  relevance: "Relevância",
  most_known: "Mais conhecidos",
  bgg_rating: "Nota BGG",
  year_desc: "Ano mais recente",
  name_asc: "Nome A–Z",
};

const OPTIONS: SearchSortOption[] = ["relevance", "most_known", "bgg_rating", "year_desc", "name_asc"];

export function sortSearchResults<T extends { name: string; yearPublished?: number; averageRating?: number; ratingsCount?: number }>(
  items: T[],
  sort: SearchSortOption
): T[] {
  if (sort === "relevance") return items; // mantém a ordem devolvida pela pesquisa
  const arr = [...items];
  if (sort === "most_known") return arr.sort((a, b) => (b.ratingsCount ?? -1) - (a.ratingsCount ?? -1));
  if (sort === "bgg_rating") return arr.sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1));
  if (sort === "year_desc") return arr.sort((a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0));
  if (sort === "name_asc") return arr.sort((a, b) => a.name.localeCompare(b.name));
  return arr;
}

type Props = {
  visible: boolean;
  active: SearchSortOption;
  onSelect: (opt: SearchSortOption) => void;
  onClose: () => void;
};

export function GameSearchSortSheet({ visible, active, onSelect, onClose }: Props) {
  const { t } = useTranslation("games");
  return <SortSheet visible={visible} options={OPTIONS.map(key => ({ key, label: t(`ui.sort.${key}`) }))} value={active} onSelect={onSelect} onClose={onClose} />;
}
