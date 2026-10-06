import React, {
  useEffect,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  withLayoutContext,
} from "expo-router";
import {
  createMaterialTopTabNavigator,
} from "expo-router/js-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { useTranslation } from "react-i18next";

const { Navigator } =
  createMaterialTopTabNavigator();

const SwipeTabs =
  withLayoutContext(Navigator);

type MainTabName =
  | "(home)"
  | "(register)"
  | "(library)"
  | "(friends)";

const TAB_META: Record<
  MainTabName,
  {
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  }
> = {
  "(home)": {
    label: "tabs.home",
    icon: "home-filled",
  },
  "(register)": {
    label: "tabs.register",
    icon: "add",
  },
  "(library)": {
    label: "tabs.library",
    icon: "casino",
  },
  "(friends)": {
    label: "tabs.friends",
    icon: "people-alt",
  },
};

export default function MainTabsLayout() {
  const [isKeyboardVisible, setIsKeyboardVisible] =
    useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios"
        ? "keyboardWillHide"
        : "keyboardDidHide";

    const showSubscription =
      Keyboard.addListener(
        showEvent,
        () => {
          setIsKeyboardVisible(true);
        }
      );

    const hideSubscription =
      Keyboard.addListener(
        hideEvent,
        () => {
          setIsKeyboardVisible(false);
        }
      );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SwipeTabs
      initialRouteName="(home)"
      tabBarPosition="bottom"
      screenOptions={{
        headerShown: false,

        /*
         * Enquanto o teclado está aberto, bloqueamos o swipe
         * horizontal entre tabs.
         *
         * Isto evita mudanças acidentais de página enquanto o
         * utilizador está a escrever num TextInput.
         *
         * Os botões da barra inferior continuam funcionais.
         */
        swipeEnabled: !isKeyboardVisible,

        animationEnabled: true,
        lazy: true,
      }}
      tabBar={(props: any) => (
        <MainBottomBar {...props} />
      )}
    >
      <SwipeTabs.Screen
        name="(home)"
      />

      <SwipeTabs.Screen
        name="(register)"
      />

      <SwipeTabs.Screen
        name="(library)"
      />

      <SwipeTabs.Screen
        name="(friends)"
      />
    </SwipeTabs>
  );
}

function MainBottomBar({
  state,
  navigation,
}: any) {
  const { t } = useTranslation("navigation");
  const insets =
    useSafeAreaInsets();

  function openDrawer() {
    let current: any =
      navigation;

    while (current) {
      if (
        typeof current.openDrawer ===
        "function"
      ) {
        current.openDrawer();
        return;
      }

      current =
        current.getParent?.();
    }

    console.warn(
      "Não foi possível encontrar o Drawer pai."
    );
  }

  function goToTab(
    routeName: MainTabName
  ) {
    const route =
      state.routes.find(
        (item: any) =>
          item.name === routeName
      );

    if (!route) {
      return;
    }

    const event =
      navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

    if (
      event.defaultPrevented
    ) {
      return;
    }

    navigation.navigate(
      routeName
    );
  }

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingBottom:
            Math.max(
              insets.bottom,
              8
            ),
        },
      ]}
    >
      <View
        style={
          styles.container
        }
      >
        <BottomItem
          label={t("tabs.more")}
          icon="menu"
          active={false}
          onPress={
            openDrawer
          }
        />

        {(
          [
            "(home)",
            "(register)",
            "(library)",
            "(friends)",
          ] as MainTabName[]
        ).map((name) => {
          const routeIndex =
            state.routes.findIndex(
              (route: any) =>
                route.name ===
                name
            );

          const active =
            routeIndex >= 0 &&
            state.index ===
              routeIndex;

          const meta =
            TAB_META[name];

          return (
            <BottomItem
              key={name}
              label={
                t(meta.label)
              }
              icon={
                meta.icon
              }
              active={
                active
              }
              emphasized={
                name ===
                "(register)"
              }
              onPress={() =>
                goToTab(name)
              }
            />
          );
        })}
      </View>
    </View>
  );
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
