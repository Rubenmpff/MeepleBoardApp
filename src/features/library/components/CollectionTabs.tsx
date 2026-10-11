// src/features/library/components/CollectionTabs.tsx
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { colors, space, touch } from "@/src/ui/theme";

export type CollectionTab = "ALL" | GameLibraryStatus.Owned | GameLibraryStatus.Wishlist | "PLAYED";

const TABS: { value: CollectionTab; label: string; count: "total" | "owned" | "wishlist" | "played" }[] = [
  { value: "ALL", label: "all", count: "total" },
  { value: GameLibraryStatus.Owned, label: "owned", count: "owned" },
  { value: GameLibraryStatus.Wishlist, label: "wanted", count: "wishlist" },
  { value: "PLAYED", label: "playedTab", count: "played" },
];

type Props = { active: CollectionTab; onChange: (tab: CollectionTab) => void; counts?: Partial<Record<"total" | "owned" | "wishlist" | "played", number>> };

// Status filters with their counts: the summary and the filter are the same control.
export function CollectionTabs({ active, onChange, counts }: Props) {
  const { t: uiT } = useTranslation("library");
  return <View style={styles.row}>
    {TABS.map(tab => {
      const on = active === tab.value, count = counts?.[tab.count];
      return <TouchableOpacity key={String(tab.value)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={uiT(`ui.${tab.label}`)}
        style={styles.touch} onPress={() => onChange(tab.value)}>
        <Text style={[styles.chip, on && styles.chipOn]}>{uiT(`ui.${tab.label}`)}{count != null ? ` ${count}` : ""}</Text>
      </TouchableOpacity>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", columnGap: space.sm, marginBottom: space.xs },
  touch: { minHeight: touch, justifyContent: "center" },
  chip: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, color: colors.text, fontSize: 15, lineHeight: 20, overflow: "hidden" },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary, color: colors.onPrimary, fontWeight: "600" },
});
