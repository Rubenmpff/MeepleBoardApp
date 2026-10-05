// src/features/games/catalog/components/GameSearchFiltersSheet.tsx
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/src/constants/colors";

export interface SearchFilters {
  playerCount?: number; // 1-4, ou 5 para "5+"
  minBggRating?: number; // 6, 7, 8
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {};

export function countActiveSearchFilters(f: SearchFilters): number {
  let n = 0;
  if (f.playerCount != null) n++;
  if (f.minBggRating != null) n++;
  return n;
}

export function applySearchFilters<T extends { minPlayers?: number; maxPlayers?: number; averageRating?: number }>(
  items: T[],
  filters: SearchFilters
): T[] {
  return items.filter((g) => {
    if (filters.playerCount != null) {
      const min = g.minPlayers ?? 1;
      const max = g.maxPlayers ?? 99;
      const target = filters.playerCount;
      const matches = target === 5 ? max >= 5 : target >= min && target <= max;
      if (!matches) return false;
    }
    if (filters.minBggRating != null) {
      if (!g.averageRating || g.averageRating < filters.minBggRating) return false;
    }
    return true;
  });
}

type Props = {
  visible: boolean;
  filters: SearchFilters;
  onApply: (f: SearchFilters) => void;
  onClose: () => void;
};

const PLAYER_OPTIONS = [1, 2, 3, 4, 5];
const RATING_OPTIONS = [6, 7, 8];

export function GameSearchFiltersSheet({ visible, filters, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<SearchFilters>(filters);
  useEffect(() => { if (visible) setDraft(filters); }, [visible, filters]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Filtros</Text>

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

          <View style={styles.actions}>
            <Pressable style={styles.clearBtn} onPress={() => setDraft(EMPTY_SEARCH_FILTERS)}>
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
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20,
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