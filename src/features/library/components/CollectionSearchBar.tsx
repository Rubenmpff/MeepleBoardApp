import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionSearchBar.tsx
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export function CollectionSearchBar({ value, onChangeText }: Props) {
  const { t: uiT } = useTranslation("library");
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={17} color={COLORS.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={uiT("ui.searchPlaceholder")}
        accessibilityLabel={uiT("ui.searchPlaceholder")}
        placeholderTextColor={COLORS.textMuted}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} style={UI_STYLES.iconButton} accessibilityRole="button" accessibilityLabel={uiT("ui.clearSearch")}>
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...UI_STYLES.field, paddingVertical: 0, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  input: { ...UI_STYLES.body, flex: 1, minHeight: 50, color: COLORS.onBackground, padding: 0 },
});
