// src/features/library/components/CollectionFiltersSheet.tsx
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/src/constants/colors";
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
  { value: "cooperative", label: "Cooperativo" },
  { value: "competitive", label: "Competitivo" },
  { value: "solo", label: "Solo" },
];
const HISTORY_OPTIONS: { value: HistoryFilter; label: string }[] = [
  { value: "never", label: "Nunca jogado" },
  { value: "recent", label: "Jogado recentemente" },
  { value: "stale", label: "Não jogado há muito tempo" },
];

export function CollectionFiltersSheet({ visible, filters, onApply, onClose }: Props) {
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
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Filtros</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Número de jogadores</Text>
            <View style={styles.pillRow}>
              {PLAYER_OPTIONS.map((n) => {
                const active = draft.playerCount === n;
                return (
                  <Pressable
                    key={n}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setDraft((d) => ({ ...d, playerCount: active ? undefined : n }))}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{n === 5 ? "5+" : n}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Nota BGG mínima</Text>
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
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => toggleType(opt.value)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Histórico</Text>
            <View style={styles.pillRow}>
              {HISTORY_OPTIONS.map((opt) => {
                const active = draft.history === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setDraft((d) => ({ ...d, history: active ? undefined : opt.value }))}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.clearBtn} onPress={() => setDraft(EMPTY_FILTERS)}>
              <Text style={styles.clearText}>Limpar tudo</Text>
            </Pressable>
            <Pressable style={styles.applyBtn} onPress={() => { onApply(draft); onClose(); }}>
              <Text style={styles.applyText}>Aplicar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, maxHeight: "80%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.onBackground, marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, marginBottom: 8, marginTop: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  pillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "14" },
  pillText: { fontSize: 13, fontWeight: "600", color: COLORS.onBackground },
  pillTextActive: { color: COLORS.primary, fontWeight: "800" },

  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  clearBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: COLORS.surface },
  clearText: { fontWeight: "700", color: COLORS.onBackground },
  applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: COLORS.primary },
  applyText: { fontWeight: "700", color: "#fff" },
});