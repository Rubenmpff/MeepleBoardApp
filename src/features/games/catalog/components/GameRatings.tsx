/**
 * Ratings on the game page, without changing how any of them is calculated:
 *   BGG and MeepleBoard side by side (each with its scale and, when known, how many ratings);
 *   «A tua avaliação» apart — the average of the ratings you gave your matches in their journals,
 *   with a way into that journal. There is no direct rating of the game itself.
 */
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Row, Section } from "@/src/ui/components";
import { colors, isLarge, space, strong, type } from "@/src/ui/theme";
import { formatDate, formatRating, locale } from "@/src/ui/format";
import { Game } from "../types/Game";

export type JournalTarget = { id: string; date: string; pending: boolean };

type Props = {
  game: Game;
  language: string;
  userRating: number | null;
  /** How many of your matches of this game have a rating. */
  ratedMatches: number;
  /** The match to rate next, or the latest one to review; null without matches. */
  journal: JournalTarget | null;
  onOpenJournal: (matchId: string) => void;
  /** Your rating comes with your match history; while it loads or fails, say so instead of «not rated». */
  personalState?: "loading" | "error" | "ready";
};

export default function GameRatings({ game, language, userRating, ratedMatches, journal, onOpenJournal, personalState = "ready" }: Props) {
  const { t } = useTranslation("games");
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const bggVotes = game.usersRatedCount ?? game.ratingsCount;
  const bgg = game.averageRating ? formatRating(game.averageRating, language) : null;
  const meeple = game.meepleBoardScore != null ? formatRating(game.meepleBoardScore / 10, language) : null;
  const count = (n: number) => new Intl.NumberFormat(locale(language)).format(n);
  const bggDetail = [bggVotes ? t("details.ratings.bggVotes", { count: bggVotes, value: count(bggVotes) }) : null,
    game.bggRanking ? t("details.ratings.bggRank", { rank: count(game.bggRanking) }) : null].filter(Boolean).join(" · ");

  const tile = (label: string, value: string | null, detail: string, empty: string) =>
    <View style={[styles.tile, large && styles.tileLarge]} accessible accessibilityLabel={value ? `${label}: ${t("details.ratings.outOf", { value })}${detail ? `. ${detail}` : ""}` : `${label}: ${empty}`}>
      <Text style={[type.caption, strong]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}<Text style={styles.scale}> /10</Text></Text> : <Text style={[type.body, styles.muted]}>{empty}</Text>}
      {!!value && !!detail && <Text style={type.micro}>{detail}</Text>}
    </View>;

  return <>
    <Section title={t("details.ratings.title")}>
      {!bgg && meeple == null ? <Card padded><Text style={[type.body, styles.muted]}>{t("details.ratings.noneYet")}</Text></Card>
        : <Card><View style={[styles.tiles, large && styles.tilesLarge]}>
          {tile(t("details.ratings.bgg"), bgg, bggDetail, t("details.ratings.noData"))}
          <View style={large ? styles.dividerLarge : styles.divider} />
          {tile(t("details.ratings.meepleBoard"), meeple, t("details.ratings.meepleBoardHint"), t("details.ratings.noData"))}
        </View></Card>}
    </Section>

    <Section title={t("details.ratings.personal")}>
      <Card>
        <View style={styles.personal} accessible accessibilityLabel={personalState !== "ready" ? t(personalState === "loading" ? "ui.loadingHistory" : "ui.loadError") : userRating != null
          ? `${t("details.ratings.personal")}: ${t("details.ratings.outOf", { value: formatRating(userRating, language) })}. ${t("details.ratings.personalHint", { count: ratedMatches })}`
          : t(journal ? "details.ratings.personalNone" : "details.ratings.personalNoMatches")}>
          {personalState !== "ready" ? <Text style={[type.body, styles.muted]}>{t(personalState === "loading" ? "ui.loadingHistory" : "ui.loadError")}</Text>
          : userRating != null ? <>
            <Text style={styles.value}>{formatRating(userRating, language)}<Text style={styles.scale}> /10</Text></Text>
            <Text style={type.caption}>{t("details.ratings.personalHint", { count: ratedMatches })}</Text>
          </> : <Text style={[type.body, styles.muted]}>{t(journal ? "details.ratings.personalNone" : "details.ratings.personalNoMatches")}</Text>}
        </View>
        {personalState === "ready" && journal && <Row title={t(journal.pending ? "details.ratings.rateMatch" : "details.ratings.reviewJournal", { date: formatDate(journal.date, language) })}
          tone="link" onPress={() => onOpenJournal(journal.id)} />}
      </Card>
    </Section>
  </>;
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row" },
  tilesLarge: { flexDirection: "column" },
  tile: { flex: 1, minWidth: 0, gap: 2, padding: space.lg },
  tileLarge: { flex: 0 },
  divider: { width: StyleSheet.hairlineWidth * 2, backgroundColor: colors.hair, marginVertical: space.md },
  dividerLarge: { height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.hair, marginHorizontal: space.lg },
  value: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  scale: { fontSize: 15, fontWeight: "400", color: colors.muted },
  muted: { color: colors.muted },
  personal: { gap: 2, padding: space.lg },
});
