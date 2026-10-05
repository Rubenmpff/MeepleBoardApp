// src/features/library/components/CollectionSortSheet.tsx
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";
import { SortOption, SORT_LABELS } from "../utils/collectionHelpers";

type Props = {
  visible: boolean;
  options: SortOption[];
  active: SortOption;
  onSelect: (option: SortOption) => void;
  onClose: () => void;
};

export function CollectionSortSheet({ visible, options, active, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Ordenar por</Text>

          {options.map((opt) => {
            const isActive = opt === active;
            return (
              <Pressable
                key={opt}
                style={styles.row}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={[styles.rowText, isActive && styles.rowTextActive]}>{SORT_LABELS[opt]}</Text>
                {isActive && <MaterialIcons name="check" size={18} color={COLORS.primary} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground, marginBottom: 8, paddingHorizontal: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, paddingHorizontal: 4 },
  rowText: { fontSize: 14, fontWeight: "600", color: COLORS.onBackground },
  rowTextActive: { color: COLORS.primary, fontWeight: "800" },
});