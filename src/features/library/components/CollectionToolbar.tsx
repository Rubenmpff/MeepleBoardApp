import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionToolbar.tsx

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";

import { ViewMode } from "../hooks/useViewModePreference";
import {
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
  const { t: uiT } = useTranslation("library");
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.filtersBtn}
        onPress={onFiltersPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={uiT("ui.openFilters")}
      >
        <MaterialIcons
          name="tune"
          size={16}
          color={COLORS.onBackground}
        />

        <Text style={styles.filtersText}>
          {uiT("ui.filters")}
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
        accessibilityLabel={uiT("ui.changeSort")}
      >
        <Text
          style={styles.sortText}
          numberOfLines={2}
        >
          {uiT(`ui.sort.${sort}`)}
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
          accessibilityLabel={uiT("ui.grid")}
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
          accessibilityLabel={uiT("ui.list")}
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
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  filtersBtn: {
    ...UI_STYLES.control,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  filtersText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.onBackground },

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
    minWidth: 140,
    ...UI_STYLES.control,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  sortText: { ...UI_STYLES.caption, flexShrink: 1, fontWeight: "700", color: COLORS.onBackground },

  viewToggle: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },

  viewBtn: { ...UI_STYLES.iconButton },

  viewBtnActive: {
    backgroundColor: COLORS.primary,
  },
});
