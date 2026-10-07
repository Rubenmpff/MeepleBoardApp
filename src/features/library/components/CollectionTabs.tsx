import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionTabs.tsx
import React, { useRef } from "react";
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";
import { GameLibraryStatus } from "../types/GameLibraryStatus";

export type CollectionTab = "ALL" | GameLibraryStatus.Owned | GameLibraryStatus.Wishlist | "PLAYED";

const TABS: { value: CollectionTab; label: string }[] = [
  { value: "ALL", label: "all" },
  { value: GameLibraryStatus.Owned, label: "owned" },
  { value: GameLibraryStatus.Wishlist, label: "wanted" },
  { value: "PLAYED", label: "playedTab" },
];

type Props = {
  active: CollectionTab;
  onChange: (tab: CollectionTab) => void;
};

export function CollectionTabs({ active, onChange }: Props) {
  const { t: uiT } = useTranslation("library");
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidths = useRef<number[]>([]);

  const moveIndicator = (index: number) => {
    const x = tabWidths.current.slice(0, index).reduce((a, b) => a + b, 0);
    Animated.spring(indicatorX, { toValue: x, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  };

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    tabWidths.current[index] = e.nativeEvent.layout.width;
    if (TABS[index].value === active) moveIndicator(index);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={String(tab.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === tab.value }}
            accessibilityLabel={uiT(`ui.${tab.label}`)}
            style={styles.tab}
            onLayout={handleLayout(index)}
            onPress={() => {
              onChange(tab.value);
              moveIndicator(index);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, active === tab.value && styles.tabTextActive]}>
              {uiT(`ui.${tab.label}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.trackBg} />
      <Animated.View
        style={[
          styles.indicator,
          { width: tabWidths.current[TABS.findIndex((t) => t.value === active)] ?? 0, transform: [{ translateX: indicatorX }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: { flexDirection: "row" },
  tab: { ...UI_STYLES.control, flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { ...UI_STYLES.caption, fontWeight: "600", color: COLORS.textMuted, textAlign: "center" },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },
  trackBg: { height: 2, backgroundColor: COLORS.border, marginTop: -2 },
  indicator: { height: 2, backgroundColor: COLORS.primary, marginTop: -2, borderRadius: 2 },
});
