import { useTranslation } from "react-i18next";
// src/features/library/components/ActiveFilterChips.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { CollectionFilters, TypeFilter } from "../utils/collectionHelpers";

const TYPE_LABELS: Record<TypeFilter, string> = {
  cooperative: "cooperative",
  competitive: "competitive",
  solo: "solo",
};

const HISTORY_LABELS: Record<string, string> = {
  never: "never",
  recent: "recent",
  stale: "staleShort",
};

type Props = {
  filters: CollectionFilters;
  onChange: (filters: CollectionFilters) => void;
  onClearAll: () => void;
};

export function ActiveFilterChips({ filters, onChange, onClearAll }: Props) {
  const { t: uiT } = useTranslation("library");
  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (filters.playerCount != null) {
    chips.push({
      key: "players",
      label: uiT("ui.playersCount", { range: filters.playerCount === 5 ? "5+" : filters.playerCount }),
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
      label: uiT(`ui.${TYPE_LABELS[t]}`),
      remove: () => onChange({ ...filters, types: (filters.types ?? []).filter((x) => x !== t) }),
    });
  });
  if (filters.history) {
    chips.push({
      key: "history",
      label: uiT(`ui.${HISTORY_LABELS[filters.history]}`),
      remove: () => onChange({ ...filters, history: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((chip) => (
          <TouchableOpacity accessibilityRole="button" key={chip.key} style={styles.chip} onPress={chip.remove}>
            <Text style={styles.chipText}>{chip.label}</Text>
            <MaterialIcons name="close" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity accessibilityRole="button" onPress={onClearAll} style={UI_STYLES.control}>
          <Text style={styles.clearAll}>{uiT("ui.clearAll")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    ...UI_STYLES.control,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  chipText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.primary },
  clearAll: { ...UI_STYLES.muted, fontWeight: "700", marginLeft: 4 },
});
