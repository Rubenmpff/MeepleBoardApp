// src/features/library/components/CollectionListItem.tsx
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { CollectionEntry, formatBggRating, formatRelativeDate } from "../utils/collectionHelpers";

type Props = {
  entry: CollectionEntry;
  onPress: () => void;
  onLongPress?: () => void;
  onPrimaryAction: () => void;
  onMenuPress?: () => void; // Fase 2
};

const STATUS_META: Record<number, { label: string; color: string }> = {
  [GameLibraryStatus.Owned]: { label: "Tenho", color: COLORS.primary },
  [GameLibraryStatus.Wishlist]: { label: "Quero", color: COLORS.secondary },
};

export function CollectionListItem({ entry, onPress, onLongPress, onPrimaryAction, onMenuPress }: Props) {
  const statusMeta = entry.status != null
    ? STATUS_META[entry.status]
    : entry.timesPlayed > 0
      ? { label: "Já jogado", color: COLORS.success }
      : null;

  const hasBgg = entry.averageRating != null && entry.averageRating > 0;
  const relativeDate = formatRelativeDate(entry.lastPlayedAt);
  const playersLabel = entry.minPlayers && entry.maxPlayers
    ? entry.minPlayers === entry.maxPlayers ? `${entry.minPlayers} jogadores` : `${entry.minPlayers}–${entry.maxPlayers} jogadores`
    : null;

  const primaryLabel = entry.status === GameLibraryStatus.Wishlist
    ? "Adicionar à coleção"
    : entry.timesPlayed > 0
      ? "Jogar novamente"
      : "Registar primeira partida";

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress} onLongPress={onLongPress}>
      {entry.gameImageUrl ? (
        <Image source={{ uri: entry.gameImageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <MaterialIcons name="casino" size={22} color={COLORS.textMuted} />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{entry.gameName}</Text>
          {onMenuPress && (
            <Pressable onPress={onMenuPress} hitSlop={8}>
              <MaterialIcons name="more-vert" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
        {entry.isExpansion && <Text style={styles.expansionTag}>Expansão</Text>}

        {statusMeta && (
          <Text style={[styles.status, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        )}

        <View style={styles.ratingRow}>
          {hasBgg ? (
            <>
              <Ionicons name="star" size={11} color={COLORS.star} />
              <Text style={styles.metaText}>{formatBggRating(entry.averageRating)} BGG</Text>
            </>
          ) : (
            <Text style={styles.metaTextMuted}>Sem nota BGG</Text>
          )}
        </View>

        <View style={styles.playsRow}>
          {entry.timesPlayed > 0 && (
            <Ionicons name="checkmark-circle" size={11} color={COLORS.success} />
          )}
          <Text style={styles.metaText}>
            {entry.timesPlayed > 0 ? `${entry.timesPlayed} partida${entry.timesPlayed === 1 ? "" : "s"}` : "Nunca jogado"}
            {relativeDate ? ` · ${relativeDate}` : ""}
          </Text>
        </View>

        {playersLabel && <Text style={styles.metaTextMuted}>{playersLabel}</Text>}

        <Pressable style={styles.primaryBtn} onPress={onPrimaryAction}>
          <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", gap: 12, backgroundColor: COLORS.card, borderRadius: 14, padding: 10,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  rowPressed: { opacity: 0.85 },

  image: { width: 68, height: 68, borderRadius: 10, backgroundColor: COLORS.surface },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.onBackground },
  status: { fontSize: 12, fontWeight: "700" },
  expansionTag: { fontSize: 11, color: COLORS.campaign, fontWeight: "700" },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, color: COLORS.onBackground },
  playsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaTextMuted: { fontSize: 12, color: COLORS.textMuted },

  primaryBtn: {
    marginTop: 6, alignSelf: "flex-start", backgroundColor: COLORS.primary + "12",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  primaryBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
});