import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";

export function FriendActionsMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Mais opções"
        style={styles.trigger}
        onPress={() => setOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => { setOpen(false); onRemove(); }}
            >
              <Ionicons name="person-remove-outline" size={18} color={COLORS.error} />
              <Text style={styles.itemTextDestructive}>Remover amigo</Text>
            </TouchableOpacity>

            <View style={styles.itemDisabled}>
              <Ionicons name="ban-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.itemTextDisabled}>Bloquear (em breve)</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingVertical: 8, paddingBottom: 28 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  itemDisabled: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16, opacity: 0.55 },
  itemTextDestructive: { color: COLORS.error, fontWeight: "700", fontSize: 15 },
  itemTextDisabled: { color: COLORS.textMuted, fontWeight: "700", fontSize: 15 },
});