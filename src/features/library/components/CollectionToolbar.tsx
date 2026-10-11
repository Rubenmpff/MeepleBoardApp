// src/features/library/components/CollectionToolbar.tsx
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ViewMode } from "../hooks/useViewModePreference";
import { SortOption } from "../utils/collectionHelpers";
import { colors, radius, space, touch, type } from "@/src/ui/theme";

type Props = {
  viewMode: ViewMode; onChangeViewMode: (mode: ViewMode) => void;
  activeFilterCount: number; onFiltersPress: () => void;
  sort: SortOption; onSortPress: () => void;
};

// Filters on the left, sort as a green text action, grid/list as a compact two-way switch.
export function CollectionToolbar({ viewMode, onChangeViewMode, activeFilterCount, onFiltersPress, sort, onSortPress }: Props) {
  const { t: uiT } = useTranslation("library");
  const mode = (value: ViewMode, icon: keyof typeof MaterialCommunityIcons.glyphMap, label: string) =>
    <TouchableOpacity style={styles.modeTouch} onPress={() => onChangeViewMode(value)} accessibilityRole="radio" accessibilityState={{ checked: viewMode === value }} accessibilityLabel={label}>
      <View style={[styles.mode, viewMode === value && styles.modeOn]}><MaterialCommunityIcons name={icon} size={20} color={viewMode === value ? colors.primary : colors.muted} /></View>
    </TouchableOpacity>;
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.action} onPress={onFiltersPress} accessibilityRole="button" accessibilityLabel={uiT("ui.openFilters")}>
        <MaterialCommunityIcons name="tune-variant" size={20} color={colors.primary} />
        <Text style={[type.body, styles.link]}>{uiT("ui.filters")}</Text>
        {activeFilterCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{activeFilterCount}</Text></View>}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.action, styles.sort]} onPress={onSortPress} accessibilityRole="button" accessibilityLabel={uiT("ui.changeSort")}>
        <MaterialCommunityIcons name="sort-variant" size={20} color={colors.primary} />
        <Text style={[type.body, styles.link, styles.shrink]} numberOfLines={1}>{uiT(`ui.sort.${sort}`)}</Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.modes} accessibilityRole="radiogroup">
        {mode("grid", "view-grid-outline", uiT("ui.grid"))}
        {mode("list", "view-list", uiT("ui.list"))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.sm, flexWrap: "wrap" },
  action: { minHeight: touch, flexDirection: "row", alignItems: "center", gap: 6, paddingRight: space.sm },
  sort: { flex: 1, minWidth: 120 },
  link: { color: colors.primary, fontWeight: "600" },
  shrink: { flexShrink: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: colors.onPrimary },
  modes: { flexDirection: "row", backgroundColor: colors.track, borderRadius: radius.control, paddingHorizontal: 2 },
  modeTouch: { minWidth: touch, minHeight: touch, justifyContent: "center", alignItems: "center" },
  mode: { width: 40, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  modeOn: { backgroundColor: colors.card },
});
