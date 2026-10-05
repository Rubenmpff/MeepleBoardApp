// src/features/library/components/CollectionToolbar.tsx

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { COLORS } from "@/src/constants/colors";

import { ViewMode } from "../hooks/useViewModePreference";
import {
  SORT_LABELS,
  SortOption,
} from "../utils/collectionHelpers";

type Props = {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  activeFilterCount: number;
  onFiltersPress: () => void;
  sort: SortOption;
  onSortPress: () => void;
};

export function CollectionToolbar({
  viewMode,
  onChangeViewMode,
  activeFilterCount,
  onFiltersPress,
  sort,
  onSortPress,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.filtersBtn}
        onPress={onFiltersPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros"
      >
        <MaterialIcons
          name="tune"
          size={16}
          color={COLORS.onBackground}
        />

        <Text style={styles.filtersText}>
          Filtros
        </Text>

        {activeFilterCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {activeFilterCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sortBtn}
        onPress={onSortPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Alterar ordenação"
      >
        <Text
          style={styles.sortText}
          numberOfLines={1}
        >
          {SORT_LABELS[sort]}
        </Text>

        <MaterialIcons
          name="expand-more"
          size={18}
          color={COLORS.onBackground}
        />
      </TouchableOpacity>

      <View
        style={styles.viewToggle}
        accessibilityRole="radiogroup"
      >
        <TouchableOpacity
          style={[
            styles.viewBtn,
            viewMode === "grid" &&
              styles.viewBtnActive,
          ]}
          onPress={() =>
            onChangeViewMode("grid")
          }
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{
            checked:
              viewMode === "grid",
          }}
          accessibilityLabel="Vista em grelha"
        >
          <MaterialIcons
            name="view-module"
            size={21}
            color={
              viewMode === "grid"
                ? "#FFFFFF"
                : COLORS.onBackground
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewBtn,
            viewMode === "list" &&
              styles.viewBtnActive,
          ]}
          onPress={() =>
            onChangeViewMode("list")
          }
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{
            checked:
              viewMode === "list",
          }}
          accessibilityLabel="Vista em lista"
        >
          <MaterialIcons
            name="view-list"
            size={22}
            color={
              viewMode === "list"
                ? "#FFFFFF"
                : COLORS.onBackground
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  filtersBtn: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  filtersText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  badge: {
    minWidth: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  sortBtn: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  sortText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  viewToggle: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },

  viewBtn: {
    width: 35,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  viewBtnActive: {
    backgroundColor: COLORS.primary,
  },
});
