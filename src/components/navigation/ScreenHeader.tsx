import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRouter,
} from "expo-router";

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { useTranslation } from "react-i18next";
import { APP_THEME } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

type HeaderMode = "back" | "root" | "cancel";

type Props = {
  title: string;
  subtitle?: string;
  mode?: HeaderMode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  onLeftPress?: () => void;
  appearance?: "default" | "refresh";
  leftAccessibilityLabel?: string;
  rightAccessibilityLabel?: string;
};

export default function ScreenHeader({
  title,
  subtitle,
  mode = "back",
  rightIcon,
  onRightPress,
  onLeftPress,
  appearance = "default",
  leftAccessibilityLabel,
  rightAccessibilityLabel,
}: Props) {
  const { t } = useTranslation("navigation");
  const router = useRouter();


  function handleLeftPress() {
    if (onLeftPress) {
      onLeftPress();
      return;
    }

    if (router.canGoBack()) router.back();
    else router.replace("/dashboard");
  }

  return (
    <View style={styles.container}>
      {mode !== "root" && <TouchableOpacity
        style={[styles.leftButton, appearance === "refresh" && refreshed.button, mode === "cancel" && styles.cancelButton]}
        onPress={handleLeftPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={
          leftAccessibilityLabel ?? t(mode === "cancel" ? "cancel" : "back")
        }
      >
        {mode === "cancel" ? <Text style={styles.cancelLabel}>{t("cancel")}</Text> : <Ionicons
          name="chevron-back"
          size={22}
          color={COLORS.onBackground}
        />}
      </TouchableOpacity>}

      <View style={[styles.textBlock, mode === "root" && { paddingLeft: 0 }]}>
        <Text
          style={[styles.title, appearance === "refresh" && UI_STYLES.title]}
          numberOfLines={appearance === "refresh" ? undefined : 1}
          accessibilityRole="header"
        >
          {title}
        </Text>

        {!!subtitle && (
          <Text
            style={[styles.subtitle, appearance === "refresh" && UI_STYLES.muted]}
            numberOfLines={appearance === "refresh" ? undefined : 2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightIcon && onRightPress ? (
        <TouchableOpacity
          style={[styles.rightButton, appearance === "refresh" && refreshed.button]}
          onPress={onRightPress}
          accessibilityLabel={rightAccessibilityLabel}
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
        <View style={[styles.rightSpacer, appearance === "refresh" && { width: 44 }]} />
      )}
    </View>
  );
}

const refreshed = StyleSheet.create({
  button: { ...UI_STYLES.iconButton, backgroundColor: APP_THEME.colors.card, borderColor: APP_THEME.colors.border },
});

const styles = StyleSheet.create({
  cancelButton: { width: "auto", minWidth: 44, maxWidth: "40%", height: "auto", minHeight: 44, paddingHorizontal: 10, paddingVertical: 10 },
  cancelLabel: { ...UI_STYLES.body, color: COLORS.primary, fontWeight: "700", textAlign: "center" },
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
