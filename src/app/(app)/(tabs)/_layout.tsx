import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import NewSheet from "@/src/features/navigation/components/NewSheet";
import { colors, isLarge, touch } from "@/src/ui/theme";

type Glyph = keyof typeof MaterialCommunityIcons.glyphMap;
// Five places: what to do now, my games, start something new, play with others, me.
const items: { name: string | null; label: string; icon: Glyph; activeIcon: Glyph }[] = [
  { name: "(home)", label: "home", icon: "home-variant-outline", activeIcon: "home-variant" },
  { name: "(library)", label: "games", icon: "dice-multiple-outline", activeIcon: "dice-multiple" },
  { name: null, label: "new", icon: "plus", activeIcon: "plus" },
  { name: "(play)", label: "play", icon: "calendar-star", activeIcon: "calendar-star" },
  { name: "(me)", label: "me", icon: "account-circle-outline", activeIcon: "account-circle" },
];
// Routes without their own tab highlight the place they belong to.
const owner: Record<string, string> = { "(friends)": "(me)", "(more)": "(me)" };

export default function MainTabsLayout() {
  return (
    <Tabs initialRouteName="(home)" screenOptions={{ headerShown: false }} tabBar={props => <MainBottomBar {...props} />}>
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="(library)" />
      <Tabs.Screen name="(play)" />
      <Tabs.Screen name="(me)" />
      <Tabs.Screen name="(friends)" options={{ href: null }} />
      <Tabs.Screen name="(more)" options={{ href: null }} />
      <Tabs.Screen name="(register)" options={{ href: null }} />
    </Tabs>
  );
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];
function MainBottomBar({ state, navigation }: TabBarProps) {
  const { t } = useTranslation("navigation");
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const [sheet, setSheet] = useState(false);
  const current = state.routes[state.index]?.name;
  const active = current ? owner[current] ?? current : undefined;
  function open(name: string | null) {
    if (!name) { setSheet(true); return; }
    const route = state.routes.find(item => item.name === name);
    if (!route) return;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  }
  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8), paddingLeft: insets.left + 4, paddingRight: insets.right + 4 }]}>
    {items.map(item => {
      const on = item.name !== null && active === item.name;
      return <TouchableOpacity key={item.label} style={styles.item} onPress={() => open(item.name)} accessibilityRole={item.name ? "tab" : "button"}
        accessibilityLabel={t("tabs." + item.label)} accessibilityState={item.name ? { selected: on } : undefined}>
        <View style={[styles.iconBox, item.name === null && styles.plus]}>
          <MaterialCommunityIcons name={on ? item.activeIcon : item.icon} size={item.name === null ? 28 : 26} color={item.name === null ? colors.onPrimary : on ? colors.primary : colors.muted} />
        </View>
        <Text style={[styles.label, on && styles.labelOn, isLarge(width, fontScale) && styles.labelLarge]} numberOfLines={1}>{t("tabs." + item.label)}</Text>
      </TouchableOpacity>;
    })}
    <NewSheet visible={sheet} onClose={() => setSheet(false)} />
  </View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 6 },
  item: { flex: 1, minWidth: 0, minHeight: touch + 6, alignItems: "center", justifyContent: "flex-start", gap: 2 },
  iconBox: { height: 34, minWidth: 34, alignItems: "center", justifyContent: "center" },
  plus: { width: 52, borderRadius: 12, backgroundColor: colors.primary },
  label: { fontSize: 11, lineHeight: 13, fontWeight: "500", color: colors.muted, textAlign: "center" },
  labelOn: { color: colors.primary, fontWeight: "600" },
  labelLarge: { fontSize: 13, lineHeight: 16 },
});
