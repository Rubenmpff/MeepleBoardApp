/**
 * Top of the game page: the cover with its own proportions, name, year and kind, then the BGG and MeepleBoard
 * ratings side by side (each on its own scale) and the facts sheet. Ratings are shown as they come; nothing
 * is recalculated here. BoardGameGeek data keeps its source and a way to the original page.
 */
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph, type Icon } from "@/src/ui/components";
import { colors, isLarge, radius, space, strong, touch, type } from "@/src/ui/theme";
import { formatRating, locale } from "@/src/ui/format";
import { Game } from "../types/Game";

type Props = { game: Game; language: string; onOpenBgg: () => void };
type HeroProps = Props & { topInset: number };

export default function GameHero({ game, language, onOpenBgg, topInset }: HeroProps) {
  const { t } = useTranslation("games");
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const subtitle = [game.yearPublished ? String(game.yearPublished) : null, t(game.isExpansion ? "ui.expansion" : "ui.baseGame"),
    game.isCooperative ? t("details.facts.cooperative") : null, game.supportsSoloMode ? t("details.facts.solo") : null].filter(Boolean).join(" · ");
  // Behind the status bar, with room for the floating back button.
  return <View style={[styles.hero, { paddingTop: topInset + 56 }]}>
    <View style={styles.cover}>
      {game.imageUrl ? <Image source={{ uri: game.imageUrl }} style={styles.image} resizeMode="contain" accessible={false} />
        : <View style={styles.placeholder}><Glyph name="dice-5" size={56} color={colors.icon} /></View>}
    </View>
    <Text style={styles.name} accessibilityRole="header">{game.name}</Text>
    {!!subtitle && <Text style={[type.caption, styles.center]}>{subtitle}</Text>}
    <Scores game={game} language={language} large={large} onOpenBgg={onOpenBgg} />
  </View>;
}

function Scores({ game, language, large, onOpenBgg }: { game: Game; language: string; large: boolean; onOpenBgg: () => void }) {
  const { t } = useTranslation("games");
  const count = (n: number) => new Intl.NumberFormat(locale(language)).format(n);
  const bgg = game.averageRating ? formatRating(game.averageRating, language) : null;
  const meeple = game.meepleBoardScore != null ? formatRating(game.meepleBoardScore / 10, language) : null;
  if (!bgg && !meeple) return <View style={styles.none} accessible accessibilityLabel={t("details.ratings.noneYet")}>
    <Glyph name="star-outline" size={18} color={colors.icon} />
    <Text style={type.caption}>{t("details.ratings.noneShort")}</Text>
  </View>;
  const votes = game.usersRatedCount ?? game.ratingsCount;
  const bggDetail = [votes ? t("details.ratings.bggVotesShort", { count: votes, value: count(votes) }) : null,
    game.bggRanking ? t("details.ratings.bggRankShort", { rank: count(game.bggRanking) }) : null].filter(Boolean).join(" · ");
  // short: what fits on the tile; label: what is read aloud.
  const tile = (label: string, short: string, dot: string, value: string | null, detail: string, onPress?: () => void) => {
    const accessibilityLabel = value ? `${label}: ${t("details.ratings.outOf", { value })}${detail ? `. ${detail}` : ""}` : `${label}: ${t("details.ratings.noData")}`;
    const body = <>
      <View style={styles.who}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text style={styles.label} numberOfLines={1}>{short}</Text>
        {onPress && <Glyph name="open-in-new" size={13} color={colors.muted} />}
      </View>
      {value ? <Text style={styles.value}>{value}<Text style={styles.scale}> /10</Text></Text> : <Text style={[type.body, styles.muted]}>{t("details.ratings.noData")}</Text>}
      {!!value && !!detail && <Text style={type.micro}>{detail}</Text>}
    </>;
    return onPress ? <TouchableOpacity style={[styles.tile, large && styles.tileLarge]} onPress={onPress} accessibilityRole="link" accessibilityLabel={accessibilityLabel} accessibilityHint={t("details.bgg.hint")}>{body}</TouchableOpacity>
      : <View style={[styles.tile, large && styles.tileLarge]} accessible accessibilityLabel={accessibilityLabel}>{body}</View>;
  };
  return <View style={[styles.scores, large && styles.scoresLarge]}>
    {tile(t("details.ratings.bgg"), t("details.ratings.bggShort"), colors.text, bgg, bggDetail, game.bggId ? onOpenBgg : undefined)}
    {tile(t("details.ratings.meepleBoard"), t("details.ratings.meepleBoard"), colors.primary, meeple, t("details.ratings.meepleBoardShort"))}
  </View>;
}

type Fact = { key: string; icon: Icon; value: string; label: string };

/** The facts BGG knows, in a compact sheet; what is missing is simply left out. */
export function GameFacts({ game, language, onOpenBgg }: Props) {
  const { t } = useTranslation("games");
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const range = (min?: number | null, max?: number | null) => min && max ? (min === max ? String(min) : `${min}–${max}`) : String(min || max || "");
  const facts: Fact[] = [
    game.minPlayers || game.maxPlayers ? { key: "players", icon: "account-group", value: range(game.minPlayers, game.maxPlayers), label: t("details.facts.players") } : null,
    game.minPlayTime || game.maxPlayTime ? { key: "minutes", icon: "clock-outline", value: range(game.minPlayTime, game.maxPlayTime), label: t("details.facts.minutes") } : null,
    game.minAge ? { key: "age", icon: "human-male-child", value: t("details.facts.ageValue", { value: game.minAge }), label: t("details.facts.age") } : null,
    game.averageWeight ? { key: "weight", icon: "puzzle-outline", value: t("details.facts.weightValue", { value: formatRating(game.averageWeight, language) }), label: t("details.facts.weight") } : null,
  ].filter((f): f is Fact => !!f);
  if (!facts.length) return null;
  // Duration, age and complexity only exist when imported from BGG: name the source and link to it.
  const fromBgg = !!game.bggId && !!(game.minPlayTime || game.maxPlayTime || game.minAge || game.averageWeight);
  const columns = large ? Math.min(2, facts.length) : facts.length;
  return <View style={styles.factsWrap}>
    <View style={styles.facts}>
      {facts.map((f, i) => <View key={f.key} style={[styles.fact, { width: `${100 / columns}%` }, i % columns > 0 && styles.factDivider, i >= columns && styles.factTop]}
        accessible accessibilityLabel={`${f.label}: ${f.value}`}>
        <Glyph name={f.icon} size={18} color={colors.icon} />
        <Text style={styles.factValue}>{f.value}</Text>
        <Text style={[type.micro, styles.center]}>{f.label}</Text>
      </View>)}
    </View>
    {fromBgg && <TouchableOpacity style={styles.source} onPress={onOpenBgg} accessibilityRole="link" accessibilityLabel={t("details.bgg.open")} accessibilityHint={t("details.bgg.hint")}>
      <Glyph name="information-outline" size={14} color={colors.muted} />
      <Text style={type.micro}>{t("details.facts.source")}</Text>
    </TouchableOpacity>}
  </View>;
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: -space.lg, marginTop: -space.lg, paddingBottom: space.xl, paddingHorizontal: space.xl, backgroundColor: colors.hero,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, borderCurve: "continuous", alignItems: "center", gap: space.xs },
  cover: { width: "100%", height: 188, marginBottom: space.md, alignItems: "center", justifyContent: "flex-end" },
  image: { width: "100%", height: "100%", shadowColor: "#30283D", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
  placeholder: { width: 150, height: 150, borderRadius: 18, backgroundColor: "#E3D8F3", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 28, lineHeight: 33, fontWeight: "700", letterSpacing: -0.4, color: colors.text, textAlign: "center" },
  center: { textAlign: "center" },
  none: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.md },
  scores: { flexDirection: "row", gap: 10, marginTop: space.lg, alignSelf: "stretch" },
  scoresLarge: { flexDirection: "column" },
  tile: { flex: 1, minWidth: 0, minHeight: touch, backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, paddingVertical: 10, paddingHorizontal: space.md, gap: 2 },
  tileLarge: { flex: 0 },
  who: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...type.micro, ...strong, letterSpacing: 0.3, textTransform: "uppercase", flexShrink: 1 },
  value: { fontSize: 26, lineHeight: 31, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  scale: { fontSize: 13, fontWeight: "400", color: colors.muted },
  muted: { color: colors.muted },
  factsWrap: { gap: space.xs },
  facts: { flexDirection: "row", flexWrap: "wrap", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.hero, borderCurve: "continuous", overflow: "hidden" },
  fact: { alignItems: "center", gap: 2, paddingVertical: 10, paddingHorizontal: 6 },
  factDivider: { borderLeftWidth: 1, borderLeftColor: colors.hair },
  factTop: { borderTopWidth: 1, borderTopColor: colors.hair },
  factValue: { fontSize: 16, lineHeight: 20, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"], textAlign: "center" },
  source: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: touch, alignSelf: "center", paddingHorizontal: space.sm, marginVertical: -space.sm },
});
