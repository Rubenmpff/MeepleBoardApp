// src/features/library/components/CollectionSearchBar.tsx
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export function CollectionSearchBar({ value, onChangeText }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={17} color={COLORS.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Pesquisar na coleção..."
        placeholderTextColor={COLORS.textMuted}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.onBackground, padding: 0 },
});