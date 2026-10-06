import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity } from "react-native";
import SheetSurface from "@/src/components/ui/SheetSurface";
import { Ionicons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

export function FriendActionsMenu({ onRemove }: { onRemove: () => void }) {
  const { t } = useTranslation("friends");
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("text.moreOptions")}
        style={styles.trigger}
        onPress={() => setOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <SheetSurface style={styles.sheet}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.item}
              onPress={() => { setOpen(false); onRemove(); }}
            >
              <Ionicons name="person-remove-outline" size={18} color={COLORS.error} />
              <Text style={styles.itemTextDestructive}>{t("text.removeFriendAction")}</Text>
            </TouchableOpacity>
          </SheetSurface>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    ...UI_STYLES.iconButton, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 18
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingVertical: 8, paddingBottom: 0 },
  item: {
    ...UI_STYLES.control, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16
  },
  itemTextDestructive: {
    ...UI_STYLES.body, color: COLORS.error, fontWeight: "700", fontSize: 15
  },
});
