import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, space, touch, type } from "@/src/ui/theme";
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";

type Props = {
  game: Game | GameSuggestion;
  inLibrary: boolean;
  libraryStatus?: GameLibraryStatus;
  timesPlayed?: number;
  onPress?: () => void;
  onAdd?: () => void;
  onManageLibrary?: () => void;
};

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
const isLocal = (game: Game | GameSuggestion) => "id" in game && typeof game.id === "string" && game.id.length > 0 && game.id !== EMPTY_GUID;

// Catalogue result: what the game is, its ratings with their source, whether it is yours, one clear action.
export function GameListItem({ game, inLibrary, libraryStatus, timesPlayed = 0, onPress, onAdd, onManageLibrary }: Props) {
  const { t, i18n } = useTranslation("games");
  const name = game.name ?? t("listItem.unknownGame");
  const pick = <K extends string>(key: K) => (key in game ? (game as Record<K, unknown>)[key] : undefined);
  const year = pick("yearPublished") as number | undefined;
  const bgg = pick("averageRating") as number | undefined;
  const mb = pick("meepleBoardScore") as number | undefined;
  const min = pick("minPlayers") as number | undefined, max = pick("maxPlayers") as number | undefined;
  const expansion = Boolean(pick("isExpansion"));
  const one = (v: number) => new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
  const facts = [expansion ? t("ui.expansion") : t("ui.baseGame"), year ? String(year) : null,
    min && max ? t("ui.playersCount", { range: min === max ? min : `${min}–${max}` }) : null].filter(Boolean).join(" · ");
  const ratings = [mb != null ? t("listItem.meepleBoardRating", { value: one(mb / 10) }) : null,
    bgg != null && bgg > 0 ? t("listItem.bggRating", { value: one(bgg) }) : t("ui.noBgg")].filter(Boolean).join(" · ");
  const status = libraryStatus === GameLibraryStatus.Owned ? t("ui.owned") : libraryStatus === GameLibraryStatus.Wishlist ? t("ui.wanted") : inLibrary ? t("ui.owned") : null;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={t("listItem.viewDetailsAccessibility", { name })}>
      <View style={styles.cover}>
        {game.imageUrl ? <Image source={{ uri: game.imageUrl }} style={styles.image} contentFit="cover" transition={180} cachePolicy="memory-disk" />
          : <MaterialCommunityIcons name="dice-5" size={24} color={colors.icon} />}
      </View>
      <View style={styles.main}>
        <Text style={[type.body, styles.name]} numberOfLines={3}>{name}</Text>
        <Text style={type.caption}>{facts}</Text>
        <Text style={type.caption}>{ratings}{isLocal(game) ? "" : ` · ${t("listItem.fromBgg")}`}</Text>
        {(status || timesPlayed > 0) && <View style={styles.meta}>
          {status && <View style={[styles.pill, libraryStatus === GameLibraryStatus.Wishlist ? styles.pillLav : styles.pillGreen]}>
            <Text style={[styles.pillText, { color: libraryStatus === GameLibraryStatus.Wishlist ? "#5B4A80" : colors.primary }]}>{status}</Text></View>}
          {timesPlayed > 0 && <Text style={type.caption}>{t("ui.matchesCount", { count: timesPlayed })}</Text>}
        </View>}
      </View>
      {inLibrary
        ? <TouchableOpacity style={styles.action} onPress={(e) => { e.stopPropagation(); onManageLibrary?.(); }} accessibilityRole="button" accessibilityLabel={t("listItem.manageAccessibility", { name })}>
          <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.muted} />
        </TouchableOpacity>
        : <TouchableOpacity style={[styles.action, styles.add, !game.bggId && styles.off]} disabled={!game.bggId}
          onPress={(e) => { e.stopPropagation(); onAdd?.(); }} accessibilityRole="button" accessibilityLabel={t("listItem.addAccessibility", { name })}>
          <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 72, paddingVertical: space.sm + 2, paddingHorizontal: space.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, marginBottom: space.sm },
  cover: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.hero, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  main: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontWeight: "600" },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 1 },
  pillGreen: { backgroundColor: colors.primarySoft }, pillLav: { backgroundColor: "#EEE9F6" },
  pillText: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  action: { width: touch, height: touch, borderRadius: touch / 2, alignItems: "center", justifyContent: "center" },
  add: { backgroundColor: colors.primarySoft },
  off: { opacity: 0.4 },
});
