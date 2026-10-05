// src/features/games/catalog/components/GameSearchSortSheet.tsx
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";

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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Ordenar por</Text>
          {OPTIONS.map((opt) => {
            const isActive = opt === active;
            return (
              <Pressable key={opt} style={styles.row} onPress={() => { onSelect(opt); onClose(); }}>
                <Text style={[styles.rowText, isActive && styles.rowTextActive]}>{SEARCH_SORT_LABELS[opt]}</Text>
                {isActive && <MaterialIcons name="check" size={18} color={COLORS.primary} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground, marginBottom: 8, paddingHorizontal: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, paddingHorizontal: 4 },
  rowText: { fontSize: 14, fontWeight: "600", color: COLORS.onBackground },
  rowTextActive: { color: COLORS.primary, fontWeight: "800" },
});