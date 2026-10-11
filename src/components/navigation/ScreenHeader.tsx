import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, isLarge, space, touch, type } from "@/src/ui/theme";

type HeaderMode = "back" | "root" | "cancel";

type Props = {
  title: string;
  subtitle?: string;
  mode?: HeaderMode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  onLeftPress?: () => void;
  /** Kept for existing callers; every header now uses the same appearance. */
  appearance?: "default" | "refresh";
  leftAccessibilityLabel?: string;
  rightAccessibilityLabel?: string;
};

// Page header shared by every screen: ‹ Voltar or Cancelar on the left, centred title, optional action.
// "root" is for top-level pages: large title on the left and the action on the right.
export default function ScreenHeader({ title, subtitle, mode = "back", rightIcon, onRightPress, onLeftPress, leftAccessibilityLabel, rightAccessibilityLabel }: Props) {
  const { t } = useTranslation("navigation");
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);

  function handleLeftPress() {
    if (onLeftPress) { onLeftPress(); return; }
    if (router.canGoBack()) router.back();
    else router.replace("/dashboard");
  }

  const right = rightIcon && onRightPress
    ? <TouchableOpacity style={styles.iconAction} onPress={onRightPress} accessibilityRole="button" accessibilityLabel={rightAccessibilityLabel}>
      <Ionicons name={rightIcon} size={24} color={colors.primary} />
    </TouchableOpacity>
    : null;

  if (mode === "root") return <View style={styles.root}>
    <View style={styles.rootText}>
      <Text style={styles.rootTitle} accessibilityRole="header">{title}</Text>
      {!!subtitle && <Text style={type.caption}>{subtitle}</Text>}
    </View>
    {right}
  </View>;

  return <View style={styles.bar}>
    <View style={[styles.side, large && styles.sideLarge]}>
      <TouchableOpacity style={styles.leftAction} onPress={handleLeftPress} accessibilityRole="button" accessibilityLabel={leftAccessibilityLabel ?? t(mode === "cancel" ? "cancel" : "back")}>
        {mode === "back" && <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />}
        <Text style={[type.body, styles.leftLabel]} numberOfLines={1}>{t(mode === "cancel" ? "cancel" : "back")}</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.center}>
      <Text style={[type.head, styles.title]} numberOfLines={large ? 3 : 2} accessibilityRole="header">{title}</Text>
      {!!subtitle && <Text style={[type.caption, styles.centerText]} numberOfLines={2}>{subtitle}</Text>}
    </View>
    <View style={[styles.side, styles.sideRight, large && styles.sideLarge]}>{right}</View>
  </View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", minHeight: 48, marginBottom: space.sm, marginHorizontal: -space.sm },
  side: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  sideRight: { alignItems: "flex-end" },
  sideLarge: { flex: 0, minWidth: 96 },
  leftAction: { minHeight: touch, minWidth: touch, flexDirection: "row", alignItems: "center", paddingRight: space.sm },
  leftLabel: { color: colors.primary, flexShrink: 1 },
  center: { flexShrink: 1, maxWidth: "60%", alignItems: "center", paddingVertical: space.xs },
  title: { textAlign: "center" },
  centerText: { textAlign: "center" },
  iconAction: { minWidth: touch, minHeight: touch, alignItems: "center", justifyContent: "center" },
  root: { flexDirection: "row", alignItems: "flex-end", gap: space.md, minHeight: 48, marginBottom: space.sm },
  rootText: { flex: 1, minWidth: 0, gap: 2 },
  rootTitle: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: colors.text, letterSpacing: -0.3 },
});
