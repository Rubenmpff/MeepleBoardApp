import { translatedRelativeDate } from "../utils/translatedRelativeDate";
import GameCover from "@/src/components/ui/GameCover";
import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionListItem.tsx
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { CollectionEntry, formatBggRating } from "../utils/collectionHelpers";

type Props = {
  entry: CollectionEntry;
  onPress: () => void;
  onLongPress?: () => void;
  onPrimaryAction: () => void;
  onMenuPress?: () => void; // Fase 2
};

const STATUS_META: Record<number, { label: string; color: string }> = {
  [GameLibraryStatus.Owned]: { label: "owned", color: COLORS.primary },
  [GameLibraryStatus.Wishlist]: { label: "wanted", color: COLORS.secondary },
};

export function CollectionListItem({ entry, onPress, onLongPress, onPrimaryAction, onMenuPress }: Props) {
  const { t: uiT } = useTranslation("library");
  const statusMeta = entry.status != null
    ? STATUS_META[entry.status]
    : entry.timesPlayed > 0
      ? { label: "alreadyPlayed", color: COLORS.success }
      : null;

  const hasBgg = entry.averageRating != null && entry.averageRating > 0;
  const relativeDate = translatedRelativeDate(entry.lastPlayedAt, uiT);
  const playersLabel = entry.minPlayers && entry.maxPlayers
    ? entry.minPlayers === entry.maxPlayers ? uiT("ui.playersCount", { range: entry.minPlayers }) : uiT("ui.playersCount", { range: `${entry.minPlayers}–${entry.maxPlayers}` })
    : null;

  const primaryLabel = entry.status === GameLibraryStatus.Wishlist
    ? uiT("ui.addCollection")
    : entry.timesPlayed > 0
      ? uiT("ui.registerAgain")
      : uiT("ui.registerFirst");

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" accessibilityLabel={uiT("ui.viewPage") + ": " + entry.gameName}>
      <GameCover uri={entry.gameImageUrl} style={styles.image} />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{entry.gameName}</Text>
          {onMenuPress && (
            <Pressable accessibilityRole="button" accessibilityLabel={uiT("ui.menuGame", { name: entry.gameName })} style={styles.menuBtn} onPress={(event) => { event.stopPropagation(); onMenuPress?.(); }} hitSlop={8}>
              <MaterialIcons name="more-vert" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
        {entry.isExpansion && <Text style={styles.expansionTag}>{uiT("ui.expansion")}
        </Text>}

        {statusMeta && (
          <Text style={[styles.status, { color: statusMeta.color }]}>{uiT(`ui.${statusMeta.label}`, { defaultValue: statusMeta.label })}
          </Text>
        )}

        <View style={styles.ratingRow}>
          {hasBgg ? (
            <>
              <Ionicons name="star" size={11} color={COLORS.star} />
              <Text style={styles.metaText}>{formatBggRating(entry.averageRating)} BGG</Text>
            </>
          ) : (
            <Text style={styles.metaTextMuted}>{uiT("ui.noBgg")}
            </Text>
          )}
        </View>

        <View style={styles.playsRow}>
          {entry.timesPlayed > 0 && (
            <Ionicons name="checkmark-circle" size={11} color={COLORS.success} />
          )}
          <Text style={styles.metaText}>
            {entry.timesPlayed > 0 ? uiT("ui.matchesCount", { count: entry.timesPlayed }) : uiT("ui.never")}
            {relativeDate ? ` · ${relativeDate}` : ""}
          </Text>
        </View>

        {playersLabel && <Text style={styles.metaTextMuted}>{playersLabel}</Text>}

        <Pressable style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={primaryLabel} onPress={(event) => { event.stopPropagation(); onPrimaryAction(); }}>
          <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuBtn: { ...UI_STYLES.iconButton },
  row: {
    ...UI_STYLES.card,
    flexDirection: "row",
    gap: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  rowPressed: { opacity: 0.85 },

  image: { width: 68, height: 68, borderRadius: 10, backgroundColor: COLORS.surface },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  info: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { ...UI_STYLES.body, flex: 1, fontWeight: "700", color: COLORS.onBackground },
  status: { ...UI_STYLES.caption, fontWeight: "700" },
  expansionTag: { ...UI_STYLES.caption, color: COLORS.campaign, fontWeight: "700" },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { ...UI_STYLES.caption, color: COLORS.onBackground },
  playsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaTextMuted: { ...UI_STYLES.muted },

  primaryBtn: { ...UI_STYLES.button, marginTop: 6, alignSelf: "flex-start", backgroundColor: COLORS.primary + "12" },
  primaryBtnText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.primary },
});
