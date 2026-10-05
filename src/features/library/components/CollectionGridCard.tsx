// src/features/library/components/CollectionGridCard.tsx
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { CollectionEntry, formatBggRating } from "../utils/collectionHelpers";

type Props = {
  entry: CollectionEntry;
  onPress: () => void;
  onLongPress?: () => void;
  onPrimaryAction: () => void;
  onMenuPress?: () => void;
};

const STATUS_META: Record<number, { label: string; color: string }> = {
  [GameLibraryStatus.Owned]: { label: "TENHO", color: COLORS.primary },
  [GameLibraryStatus.Wishlist]: { label: "QUERO", color: COLORS.secondary },
};

export function CollectionGridCard({ entry, onPress, onLongPress, onPrimaryAction, onMenuPress }: Props) {
  const statusMeta = entry.status != null
    ? STATUS_META[entry.status]
    : entry.timesPlayed > 0
      ? { label: "JÁ JOGADO", color: COLORS.success }
      : null;

  const bggText = formatBggRating(entry.averageRating);
  const hasBgg = entry.averageRating != null && entry.averageRating > 0;

  const primaryLabel = entry.status === GameLibraryStatus.Wishlist
    ? "Adicionar à coleção"
    : entry.timesPlayed > 0
      ? "Jogar novamente"
      : "Registar primeira partida";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.imageWrap}>
        {entry.gameImageUrl ? (
          <Image source={{ uri: entry.gameImageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="casino" size={32} color={COLORS.textMuted} />
          </View>
        )}

        <View style={styles.imageOverlayRow}>
          {statusMeta && (
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.color }]}>
              <Text style={styles.statusBadgeText}>{statusMeta.label}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {onMenuPress && (
            <Pressable style={styles.menuBtn} onPress={onMenuPress} hitSlop={8}>
              <MaterialIcons name="more-vert" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{entry.gameName}</Text>
        {entry.isExpansion && <Text style={styles.expansionTag}>Expansão</Text>}

        <View style={styles.ratingRow}>
          {hasBgg ? (
            <>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <Text style={styles.ratingText}>{bggText} BGG</Text>
            </>
          ) : (
            <Text style={styles.ratingTextMuted}>Sem nota BGG</Text>
          )}
        </View>

        <View style={styles.playsRow}>
          {entry.timesPlayed > 0 && (
            <Ionicons name="checkmark-circle" size={11} color={COLORS.success} />
          )}
          <Text style={styles.playsText}>
            {entry.timesPlayed > 0 ? `${entry.timesPlayed} partida${entry.timesPlayed === 1 ? "" : "s"}` : "Nunca jogado"}
          </Text>
        </View>

        <Pressable style={styles.primaryBtn} onPress={onPrimaryAction}>
          <Text style={styles.primaryBtnText} numberOfLines={1}>{primaryLabel}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  imageWrap: { aspectRatio: 1, backgroundColor: COLORS.surface, justifyContent: "flex-end" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },

  imageOverlayRow: { flexDirection: "row", alignItems: "center", padding: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  menuBtn: {
    width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  body: { padding: 10, gap: 3 },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.onBackground },
  expansionTag: { fontSize: 10, color: COLORS.campaign, fontWeight: "700", marginTop: -1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, color: COLORS.onBackground, fontWeight: "600" },
  ratingTextMuted: { fontSize: 12, color: COLORS.textMuted },
  playsText: { fontSize: 11, color: COLORS.textMuted },
  playsRow: { flexDirection: "row", alignItems: "center", gap: 4 },

  primaryBtn: {
    marginTop: 8, backgroundColor: COLORS.primary + "12", borderRadius: 8,
    paddingVertical: 7, alignItems: "center",
  },
  primaryBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
});