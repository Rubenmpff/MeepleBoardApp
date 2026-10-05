import SheetSurface from "@/src/components/ui/SheetSurface";
import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionFiltersSheet.tsx
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import {
  CollectionFilters, EMPTY_FILTERS, HistoryFilter, TypeFilter,
} from "../utils/collectionHelpers";

type Props = {
  visible: boolean;
  filters: CollectionFilters;
  onApply: (filters: CollectionFilters) => void;
  onClose: () => void;
};

const PLAYER_OPTIONS = [1, 2, 3, 4, 5];
const RATING_OPTIONS = [7, 8, 9];
const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "cooperative", label: "cooperative" },
  { value: "competitive", label: "competitive" },
  { value: "solo", label: "solo" },
];
const HISTORY_OPTIONS: { value: HistoryFilter; label: string }[] = [
  { value: "never", label: "never" },
  { value: "recent", label: "recent" },
  { value: "stale", label: "stale" },
];

export function CollectionFiltersSheet({ visible, filters, onApply, onClose }: Props) {
  const { t: uiT } = useTranslation("library");
  const [draft, setDraft] = useState<CollectionFilters>(filters);

  React.useEffect(() => { if (visible) setDraft(filters); }, [visible, filters]);

  const toggleType = (type: TypeFilter) => {
    setDraft((d) => {
      const current = d.types ?? [];
      const has = current.includes(type);
      return { ...d, types: has ? current.filter((t) => t !== type) : [...current, type] };
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <SheetSurface style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{uiT("ui.filters")}
          </Text>

          <View>
            <Text style={styles.sectionLabel}>{uiT("ui.players")}
            </Text>
            <View style={styles.pillRow}>
              {PLAYER_OPTIONS.map((n) => {
                const active = draft.playerCount === n;
                return (
                  <Pressable
                    key={n}
                    accessibilityRole="button" accessibilityState={{ selected: active }}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setDraft((d) => ({ ...d, playerCount: active ? undefined : n }))}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{n === 5 ? "5+" : n}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{uiT("ui.minRating")}
            </Text>
            <View style={styles.pillRow}>
              {RATING_OPTIONS.map((n) => {
                const active = draft.minBggRating === n;
                return (
                  <Pressable
                    key={n}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setDraft((d) => ({ ...d, minBggRating: active ? undefined : n }))}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{n}+</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Tipo</Text>
            <View style={styles.pillRow}>
              {TYPE_OPTIONS.map((opt) => {
                const active = (draft.types ?? []).includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={uiT(`ui.${opt.label}`)}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => toggleType(opt.value)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{uiT(`ui.${opt.label}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{uiT("ui.history")}
            </Text>
            <View style={styles.pillRow}>
              {HISTORY_OPTIONS.map((opt) => {
                const active = draft.history === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setDraft((d) => ({ ...d, history: active ? undefined : opt.value }))}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{uiT(`ui.${opt.label}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.clearBtn} accessibilityRole="button" accessibilityLabel={uiT("ui.clearAll")} onPress={() => setDraft(EMPTY_FILTERS)}>
              <Text style={styles.clearText}>{uiT("ui.clearAll")}
              </Text>
            </Pressable>
            <Pressable style={styles.applyBtn} accessibilityRole="button" accessibilityLabel={uiT("ui.apply")} onPress={() => { onApply(draft); onClose(); }}>
              <Text style={styles.applyText}>{uiT("ui.apply")}
              </Text>
            </Pressable>
          </View>
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
    paddingBottom: 20,
    maxHeight: "80%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 12 },
  title: { ...UI_STYLES.section, marginBottom: 16 },
  sectionLabel: { ...UI_STYLES.muted, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    ...UI_STYLES.control,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "14" },
  pillText: { ...UI_STYLES.caption, fontWeight: "600", color: COLORS.onBackground },
  pillTextActive: { color: COLORS.primary, fontWeight: "800" },

  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  clearBtn: { ...UI_STYLES.button, flex: 1, backgroundColor: COLORS.surface },
  clearText: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.onBackground },
  applyBtn: { ...UI_STYLES.button, flex: 1, backgroundColor: COLORS.primary },
  applyText: { ...UI_STYLES.body, fontWeight: "700", color: "#fff" },
});
