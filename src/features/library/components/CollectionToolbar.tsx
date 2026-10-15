// src/features/library/components/CollectionToolbar.tsx
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ViewMode } from "../hooks/useViewModePreference";
import { SortOption } from "../utils/collectionHelpers";
import { Glyph, type Icon } from "@/src/ui/components";
import { ListToolbar } from "@/src/ui/Filters";
import { colors, radius, touch } from "@/src/ui/theme";

type Props = {
  viewMode: ViewMode; onChangeViewMode: (mode: ViewMode) => void;
  activeFilterCount: number; onFiltersPress: () => void;
  sort: SortOption; onSortPress: () => void;
  /** «2 de 4 jogos» when search or filters narrow the list. */
  count?: string;
};

// The common toolbar (filters, count, sort) with the library's grid/list switch at the end.
export function CollectionToolbar({ viewMode, onChangeViewMode, activeFilterCount, onFiltersPress, sort, onSortPress, count }: Props) {
  const { t: uiT } = useTranslation("library");
  const mode = (value: ViewMode, icon: Icon, label: string) =>
    <TouchableOpacity style={styles.modeTouch} onPress={() => onChangeViewMode(value)} accessibilityRole="radio" accessibilityState={{ checked: viewMode === value }} accessibilityLabel={label}>
      <View style={[styles.mode, viewMode === value && styles.modeOn]}><Glyph name={icon} size={20} color={viewMode === value ? colors.primary : colors.muted} /></View>
    </TouchableOpacity>;
  return <View style={styles.wrap}>
    <ListToolbar filterCount={activeFilterCount} onFilters={onFiltersPress} sortLabel={uiT(`ui.sort.${sort}`)} onSort={onSortPress}
      end={<View style={styles.modes} accessibilityRole="radiogroup">{mode("grid", "view-grid-outline", uiT("ui.grid"))}{mode("list", "view-list", uiT("ui.list"))}</View>} />
    {!!count && <ListToolbar count={count} filterCount={0} />}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  modes: { flexDirection: "row", backgroundColor: colors.track, borderRadius: radius.control, paddingHorizontal: 2 },
  modeTouch: { minWidth: touch, minHeight: touch, justifyContent: "center", alignItems: "center" },
  mode: { width: 40, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  modeOn: { backgroundColor: colors.card },
});
