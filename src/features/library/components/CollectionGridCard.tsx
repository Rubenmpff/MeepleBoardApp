import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionGridCard.tsx
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
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
  [GameLibraryStatus.Owned]: { label: "ownedBadge", color: COLORS.primary },
  [GameLibraryStatus.Wishlist]: { label: "wantedBadge", color: COLORS.secondary },
};

export function CollectionGridCard({ entry, onPress, onLongPress, onPrimaryAction, onMenuPress }: Props) {
  const { t: uiT } = useTranslation("library");
  const statusMeta = entry.status != null
    ? STATUS_META[entry.status]
    : entry.timesPlayed > 0
      ? { label: "playedBadge", color: COLORS.success }
      : null;

  const bggText = formatBggRating(entry.averageRating);
  const hasBgg = entry.averageRating != null && entry.averageRating > 0;

  const primaryLabel = entry.status === GameLibraryStatus.Wishlist
    ? uiT("ui.addCollection")
    : entry.timesPlayed > 0
      ? uiT("ui.registerAgain")
      : uiT("ui.registerFirst");

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress} accessibilityRole="button" accessibilityLabel={uiT("ui.viewPage") + ": " + entry.gameName}
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
              <Text style={styles.statusBadgeText}>{uiT(`ui.${statusMeta.label}`, { defaultValue: statusMeta.label })}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {onMenuPress && (
            <Pressable accessibilityRole="button" accessibilityLabel={uiT("ui.menuGame", { name: entry.gameName })} style={styles.menuBtn} onPress={(event) => { event.stopPropagation(); onMenuPress?.(); }} hitSlop={8}>
              <MaterialIcons name="more-vert" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{entry.gameName}</Text>
        {entry.isExpansion && <Text style={styles.expansionTag}>{uiT("ui.expansion")}
        </Text>}

        <View style={styles.ratingRow}>
          {hasBgg ? (
            <>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <Text style={styles.ratingText}>{bggText} BGG</Text>
            </>
          ) : (
            <Text style={styles.ratingTextMuted}>{uiT("ui.noBgg")}
            </Text>
          )}
        </View>

        <View style={styles.playsRow}>
          {entry.timesPlayed > 0 && (
            <Ionicons name="checkmark-circle" size={11} color={COLORS.success} />
          )}
          <Text style={styles.playsText}>
            {entry.timesPlayed > 0 ? uiT("ui.matchesCount", { count: entry.timesPlayed }) : uiT("ui.never")}
          </Text>
        </View>

        <Pressable style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={primaryLabel} onPress={(event) => { event.stopPropagation(); onPrimaryAction(); }}>
          <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...UI_STYLES.card,
    flex: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  imageWrap: { aspectRatio: 1, backgroundColor: COLORS.surface, justifyContent: "flex-end" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },

  imageOverlayRow: { flexDirection: "row", alignItems: "center", padding: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { ...UI_STYLES.caption, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  menuBtn: { ...UI_STYLES.iconButton, backgroundColor: "rgba(0,0,0,0.35)" },

  body: { padding: 12, gap: 4 },
  name: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.onBackground },
  expansionTag: { ...UI_STYLES.caption, color: COLORS.campaign, fontWeight: "700", marginTop: -1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { ...UI_STYLES.caption, color: COLORS.onBackground, fontWeight: "600" },
  ratingTextMuted: { ...UI_STYLES.muted },
  playsText: { ...UI_STYLES.muted },
  playsRow: { flexDirection: "row", alignItems: "center", gap: 4 },

  primaryBtn: { ...UI_STYLES.button, marginTop: 8, backgroundColor: COLORS.primary + "12" },
  primaryBtnText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.primary },
});
