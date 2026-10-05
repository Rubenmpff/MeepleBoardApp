import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRouter,
} from "expo-router";

import { COLORS } from "@/src/constants/colors";

type HeaderMode = "back" | "menu";

type Props = {
  title: string;
  subtitle?: string;
  mode?: HeaderMode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  onLeftPress?: () => void;
};

export default function ScreenHeader({
  title,
  subtitle,
  mode = "back",
  rightIcon,
  onRightPress,
  onLeftPress,
}: Props) {
  const router = useRouter();
  const navigation = useNavigation();

  function handleLeftPress() {
    if (onLeftPress) {
      onLeftPress();
      return;
    }

    if (mode === "back") {
      router.back();
      return;
    }

    const drawerNavigation =
      navigation as unknown as {
        openDrawer?: () => void;
        getParent?: () => {
          openDrawer?: () => void;
        } | undefined;
      };

    if (drawerNavigation.openDrawer) {
      drawerNavigation.openDrawer();
      return;
    }

    drawerNavigation
      .getParent?.()
      ?.openDrawer?.();
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.leftButton}
        onPress={handleLeftPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={
          mode === "back"
            ? "Voltar"
            : "Abrir menu"
        }
      >
        <Ionicons
          name={
            mode === "back"
              ? "chevron-back"
              : "menu"
          }
          size={22}
          color={COLORS.onBackground}
        />
      </TouchableOpacity>

      <View style={styles.textBlock}>
        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </Text>

        {!!subtitle && (
          <Text
            style={styles.subtitle}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightIcon && onRightPress ? (
        <TouchableOpacity
          style={styles.rightButton}
          onPress={onRightPress}
          activeOpacity={0.82}
          accessibilityRole="button"
        >
          <Ionicons
            name={rightIcon}
            size={20}
            color={COLORS.onBackground}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  leftButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  textBlock: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },

  title: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.onBackground,
    letterSpacing: -0.2,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textMuted,
  },

  rightButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  rightSpacer: {
    width: 42,
    height: 42,
  },
});
