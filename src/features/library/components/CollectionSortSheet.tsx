import SheetSurface from "@/src/components/ui/SheetSurface";
import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionSortSheet.tsx
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";
import { SortOption } from "../utils/collectionHelpers";

type Props = {
  visible: boolean;
  options: SortOption[];
  active: SortOption;
  onSelect: (option: SortOption) => void;
  onClose: () => void;
};

export function CollectionSortSheet({ visible, options, active, onSelect, onClose }: Props) {
  const { t: uiT } = useTranslation("library");
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <SheetSurface style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{uiT("ui.sortTitle")}
          </Text>

          {options.map((opt) => {
            const isActive = opt === active;
            return (
              <Pressable
                key={opt}
                style={styles.row} accessibilityRole="radio" accessibilityState={{ checked: isActive }} accessibilityLabel={uiT(`ui.sort.${opt}`)}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={[styles.rowText, isActive && styles.rowTextActive]}>{uiT(`ui.sort.${opt}`)}
                </Text>
                {isActive && <MaterialIcons name="check" size={18} color={COLORS.primary} />}
              </Pressable>
            );
          })}
        </SheetSurface>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 12 },
  title: { ...UI_STYLES.section, marginBottom: 8, paddingHorizontal: 4 },
  row: { ...UI_STYLES.control, flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 4 },
  rowText: { ...UI_STYLES.body, fontWeight: "600", color: COLORS.onBackground },
  rowTextActive: { color: COLORS.primary, fontWeight: "800" },
});
