import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { ROUTES } from "@/src/constants/routes";

const items = [
  { name: "(home)", label: "home", icon: "home-filled" },
  { name: "(library)", label: "library", icon: "casino" },
  { name: null, label: "register", icon: "add" },
  { name: "(friends)", label: "friends", icon: "people-alt" },
  { name: "(more)", label: "more", icon: "more-horiz" },
] as const;

export default function MainTabsLayout() {
  return (
    <Tabs initialRouteName="(home)" screenOptions={{ headerShown: false }} tabBar={props => <MainBottomBar {...props} />}>
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="(library)" />
      <Tabs.Screen name="(friends)" />
      <Tabs.Screen name="(more)" />
      <Tabs.Screen name="(register)" options={{ href: null }} />
    </Tabs>
  );
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];
function MainBottomBar({ state, navigation }: TabBarProps) {
  const { t } = useTranslation("navigation");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  function open(name: string | null) {
    if (!name) { router.push(ROUTES.REGISTER_MATCH); return; }
    const route = state.routes.find(item => item.name === name);
    if (!route) return;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  }
  return <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 8), paddingLeft: insets.left + 8, paddingRight: insets.right + 8 }]}>
    <View style={styles.container}>
      {items.map(item => <BottomItem key={item.label} label={t("tabs." + item.label)} icon={item.icon}
        active={item.name !== null && state.routes[state.index]?.name === item.name}
        emphasized={item.name === null} onPress={() => open(item.name)} />)}
    </View>
  </View>;
}

function BottomItem({
  label,
  icon,
  active,
  emphasized = false,
  onPress,
}: {
  label: string;
  icon:
    keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  emphasized?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={
        styles.item
      }
      activeOpacity={
        0.78
      }
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        label
      }
      accessibilityState={{
        selected:
          active,
      }}
    >
      <View
        style={[
          styles.iconWrap,
          active &&
            styles.iconWrapActive,
          emphasized &&
            styles.registerWrap,
        ]}
      >
        <MaterialIcons
          name={icon}
          size={
            emphasized
              ? 30
              : 25
          }
          color={
            emphasized
              ? "#FFFFFF"
              : active
                ? COLORS.primary
                : COLORS.onBackground
          }
        />
      </View>

      <Text
        style={[
          styles.label,
          active &&
            styles.labelActive,
          emphasized &&
            styles.registerLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      backgroundColor:
        COLORS.background,
      paddingHorizontal:
        8,
      paddingTop: 8,
    },

    container: {
      minHeight: 70,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-around",

      backgroundColor:
        COLORS.card,

      borderRadius: 20,

      paddingHorizontal:
        4,
      paddingTop: 7,
      paddingBottom: 5,

      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        COLORS.border,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity:
        0.08,
      shadowRadius: 12,
      elevation: 8,
    },

    item: {
      ...UI_STYLES.control,
      minHeight: 64,
      paddingVertical: 4,
      flex: 1,
      minWidth: 0,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    iconWrap: {
      width: 42,
      height: 36,
      borderRadius: 13,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    iconWrapActive: {
      backgroundColor:
        COLORS.primarySoft,
    },

    registerWrap: {
      width: 50,
      height: 46,
      borderRadius: 16,
      backgroundColor:
        COLORS.primary,
    },

    label: {
      marginTop: 2,
      ...UI_STYLES.caption,
      textAlign: "center",
      alignSelf: "stretch",
      fontSize: 12,
      lineHeight: 17,
      fontWeight:
        "600",
      color:
        COLORS.textMuted,
    },

    labelActive: {
      color:
        COLORS.primary,
      fontWeight:
        "800",
    },

    registerLabel: {
      color:
        COLORS.primary,
      fontWeight:
        "800",
    },
  });
