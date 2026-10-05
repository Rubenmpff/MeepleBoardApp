// src/features/library/components/ActiveFilterChips.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";
import { CollectionFilters, TypeFilter } from "../utils/collectionHelpers";

const TYPE_LABELS: Record<TypeFilter, string> = {
  cooperative: "Cooperativo",
  competitive: "Competitivo",
  solo: "Solo",
};

const HISTORY_LABELS: Record<string, string> = {
  never: "Nunca jogado",
  recent: "Jogado recentemente",
  stale: "Não jogado há muito",
};

type Props = {
  filters: CollectionFilters;
  onChange: (filters: CollectionFilters) => void;
  onClearAll: () => void;
};

export function ActiveFilterChips({ filters, onChange, onClearAll }: Props) {
  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (filters.playerCount != null) {
    chips.push({
      key: "players",
      label: `${filters.playerCount === 5 ? "5+" : filters.playerCount} jogadores`,
      remove: () => onChange({ ...filters, playerCount: undefined }),
    });
  }
  if (filters.minBggRating != null) {
    chips.push({
      key: "bgg",
      label: `BGG ${filters.minBggRating}+`,
      remove: () => onChange({ ...filters, minBggRating: undefined }),
    });
  }
  (filters.types ?? []).forEach((t) => {
    chips.push({
      key: `type-${t}`,
      label: TYPE_LABELS[t],
      remove: () => onChange({ ...filters, types: (filters.types ?? []).filter((x) => x !== t) }),
    });
  });
  if (filters.history) {
    chips.push({
      key: "history",
      label: HISTORY_LABELS[filters.history],
      remove: () => onChange({ ...filters, history: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((chip) => (
          <TouchableOpacity key={chip.key} style={styles.chip} onPress={chip.remove}>
            <Text style={styles.chipText}>{chip.label}</Text>
            <MaterialIcons name="close" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onClearAll}>
          <Text style={styles.clearAll}>Limpar tudo</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.primary + "12", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.primary + "30",
  },
  chipText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  clearAll: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginLeft: 4 },
});