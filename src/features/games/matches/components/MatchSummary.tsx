import { View, Text, StyleSheet } from "react-native";
import { Glyph } from "@/src/ui/components";
import { formatDate, formatDuration, locale } from "@/src/ui/format";
import { useTranslation } from "react-i18next";
import { MatchDto } from "../types/MatchForm";
import GameCover from "@/src/ui/GameCover";
import { matchResultText } from "../../sessions/utils/matchResultKey";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

export default function MatchSummary({ match }: { match: MatchDto }) {
  const { t, i18n } = useTranslation("matches");
  const date = match.matchDate ? new Date(match.matchDate) : null;
  return <View style={styles.summary}>
    <View style={styles.heading}>
      <GameCover uri={match.gameImageUrl} size={100} />
      <View style={styles.info}>
        <Text style={styles.name}>{match.gameName?.trim() || t("sessions.gameNameUnavailable")}</Text>
        <Text style={styles.meta}>{matchResultText(match, t)}</Text>
        {date && !Number.isNaN(date.getTime()) && <Text style={styles.meta}>{`${formatDate(date, i18n.language)} · ${new Intl.DateTimeFormat(locale(i18n.language), { hour: "2-digit", minute: "2-digit" }).format(date)}`}</Text>}
        {match.durationInMinutes != null && <Text style={styles.meta}>{formatDuration(match.durationInMinutes, i18n.language)}</Text>}
      </View>
    </View>
    {(match.players ?? []).map(player => <View key={player.userId} style={styles.player}>
      <View style={styles.playerName}>
        {(match.result != null ? player.outcome === "Win" : match.winnerId === player.userId) && <Glyph name="trophy-outline" size={15} color={COLORS.primary} />}
        <Text style={[styles.body, (match.result != null ? player.outcome === "Win" : match.winnerId === player.userId) && styles.winner]}>{player.userName?.trim() || t("sessions.playerNameUnavailable")}</Text>
      </View>
      <Text style={styles.meta}>{player.outcome ? t(`outcomes.${player.outcome}`) : t("outcomes.noIndividualResult")}</Text>
      <Text style={styles.score}>{player.score == null ? t("sessions.scoreUndefined") : String(player.score)}</Text>
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  summary: { gap: 10 }, heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1, gap: 4 }, name: { ...UI_STYLES.section }, meta: { ...UI_STYLES.caption, color: COLORS.textMuted },
  player: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  playerName: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  body: { ...UI_STYLES.body, flexShrink: 1 }, winner: { fontWeight: "700", color: COLORS.primary },
  score: { ...UI_STYLES.body, fontWeight: "700" },
});
