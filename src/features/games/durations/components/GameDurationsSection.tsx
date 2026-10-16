/**
 * «Duração das partidas» on the game page: three references kept apart — «A tua média» (your matches),
 * «Média MeepleBoard» (matches every participant shares) and, marked as BGG data, the duration of the BGG entry.
 * Only the essentials here: average, number of matches and one faithful word for the method; the rest is in
 * «Ver detalhes». Without enough data the community side says so discreetly; BGG never fills it in.
 */
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph, Section, Segmented } from "@/src/ui/components";
import { colors, isLarge, radius, space, strong, touch, type } from "@/src/ui/theme";
import { formatDuration } from "@/src/features/games/matches/utils/matchDuration";
import { Game } from "@/src/features/games/catalog/types/Game";
import { useGameDurations } from "../hooks/useGameDurations";
import { DurationStats, methodLabel } from "../types/GameDurations";

/** The BGG entry's playing time, only when it came from BGG. */
export function bggDuration(game: Game): string | null {
  if (!game.bggId || !(game.minPlayTime || game.maxPlayTime)) return null;
  const min = game.minPlayTime || game.maxPlayTime!, max = game.maxPlayTime || game.minPlayTime!;
  return min === max ? `${min} min` : `${min}–${max} min`;
}

export function useMethodText() {
  const { t } = useTranslation("games");
  return (s: DurationStats) => {
    const kind = methodLabel(s);
    return kind === "mixed" ? t("details.durations.mixed") : kind === "notStated" ? t("details.durations.notStated")
      : t(`details.durations.${kind}`, { count: s.count });
  };
}

type Props = { game: Game; onOpenDetails: () => void };

export default function GameDurationsSection({ game, onOpenDetails }: Props) {
  const { t } = useTranslation("games");
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const { data, loading, error, reload } = useGameDurations(game.id);
  const [mode, setMode] = useState<"multiplayer" | "solo" | null>(null);
  const methodText = useMethodText();
  const bgg = bggDuration(game);
  // Open on the mode you have data for; multiplayer when both or neither.
  const shown = mode ?? (data && !data.personal.multiplayer.count && data.personal.solo.count ? "solo" : "multiplayer");

  const tile = (label: string, dot: string, s: DurationStats | undefined, empty: string, emptyHint?: string) =>
    <View style={[styles.tile, !large && styles.tileHalf]} accessible
      accessibilityLabel={s?.available && s.mean != null ? `${label}: ${formatDuration(s.mean)}, ${t("details.durations.matches", { count: s.count })}, ${methodText(s)}` : `${label}: ${empty}`}>
      <View style={styles.who}><View style={[styles.dot, { backgroundColor: dot }]} /><Text style={styles.label}>{label}</Text></View>
      {s?.available && s.mean != null ? <>
        <Text style={[styles.value, s.count === 1 && styles.valueSmall]}>{formatDuration(s.mean)}</Text>
        <Text style={type.micro}><Text style={[strong, { color: colors.text }]}>{t("details.durations.matches", { count: s.count })}</Text> · {methodText(s)}</Text>
      </> : <>
        <Text style={[type.body, strong, { color: colors.muted }]}>{empty}</Text>
        {!!emptyHint && <Text style={type.micro}>{emptyHint}</Text>}
      </>}
    </View>;

  const mine = data?.personal[shown];
  const community = data?.community[shown];
  return <Section title={t("details.durations.title")}>
    <View style={styles.wrap}>
      <Segmented role="button" items={[{ key: "multiplayer", label: t("details.durations.multiplayer") }, { key: "solo", label: t("details.durations.solo") }]} value={shown} onChange={setMode} />
      {loading && !data ? <ActivityIndicator color={colors.primary} />
        : error && !data ? <TouchableOpacity accessibilityRole="button" onPress={() => { void reload(); }} style={styles.retry}>
          <Text style={type.caption}>{t("details.durations.loadError")}</Text><Text style={styles.link}>{t("details.durations.retry")}</Text>
        </TouchableOpacity>
        : <View style={[styles.tiles, large && styles.tilesColumn]}>
          {tile(mine?.count === 1 ? t("details.durations.mineOne") : t("details.durations.mine"), colors.gold, mine, t("details.durations.mineEmpty"))}
          {tile(t("details.durations.community"), colors.primary, community, t("details.durations.communityEmpty"), t("details.durations.communityEmptyHint"))}
        </View>}
      {!!bgg && <View style={styles.bgg} accessible accessibilityLabel={t("details.durations.bggLabel", { value: bgg })}>
        <View style={styles.who}><View style={[styles.dot, { backgroundColor: colors.text }]} /><Text style={styles.label}>{t("details.durations.bgg")}</Text></View>
        <View style={styles.flex} /><Text style={[type.body, strong]}>{bgg}</Text>
      </View>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("details.durations.details")} onPress={onOpenDetails} style={styles.row}>
        <Glyph name="chart-box-outline" size={20} color={colors.icon} />
        <Text style={[type.body, styles.flex]}>{t("details.durations.details")}</Text>
        <Glyph name="chevron-right" size={20} color={colors.chevron} />
      </TouchableOpacity>
      <View style={styles.note}><Glyph name="information-outline" size={14} color={colors.muted} /><Text style={[type.micro, styles.flex]}>{t("details.durations.note")}</Text></View>
    </View>
  </Section>;
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  tiles: { flexDirection: "row", gap: 10 },
  tilesColumn: { flexDirection: "column" },
  tile: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, paddingVertical: 12, paddingHorizontal: 14, gap: 3 },
  tileHalf: { flex: 1, minWidth: 0 },
  who: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...type.micro, ...strong, letterSpacing: 0.3, textTransform: "uppercase", flexShrink: 1 },
  value: { fontSize: 24, lineHeight: 29, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  valueSmall: { fontSize: 17, lineHeight: 22 },
  bgg: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch, paddingHorizontal: 14, borderRadius: radius.hero, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52, paddingHorizontal: space.lg, backgroundColor: colors.card, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.line },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 2 },
  retry: { gap: 4, minHeight: touch, justifyContent: "center" },
  link: { ...type.body, ...strong, color: colors.primary },
  flex: { flex: 1, minWidth: 0 },
});
