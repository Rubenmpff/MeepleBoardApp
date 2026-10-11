/**
 * Factual summary of a match, the same for everyone who can see it: game, date, mode,
 * result, players with outcomes and scores, and the shared summary. Participants also
 * get the way into their own journal (rating, notes, photos).
 */
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenState from "@/src/components/ui/ScreenState";
import ScreenScroll from "@/src/ui/Screen";
import { Avatar, Card, Glyph, Hero, Row, Section } from "@/src/ui/components";
import { colors, space, strong, type } from "@/src/ui/theme";
import { formatDateTime } from "@/src/ui/format";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import GameCover from "@/src/components/ui/GameCover";
import { matchResultText } from "../../sessions/utils/matchResultKey";
import matchService from "../services/matchService";
import { MatchDto } from "../types/MatchForm";

export default function MatchDetailScreen() {
  const { t, i18n } = useTranslation("matches");
  const { id, originSessionId } = useLocalSearchParams<{ id: string; originSessionId?: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const backToOrigin = () => {
    if (router.canGoBack()) router.back();
    else if (originSessionId) router.replace({ pathname: "/games/sessions/[id]", params: { id: originSessionId } });
    else router.replace(ROUTES.HOME as never);
  };

  const [match, setMatch] = useState<MatchDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setNotFound(false); setLoadError(false); setLoading(true);
    try { const data = await matchService.getById(id); if (!data) setNotFound(true); setMatch(data); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const header = <View style={styles.header}><ScreenHeader title={t("ui.detailsTitle")} leftAccessibilityLabel={t("ui.back")} onLeftPress={backToOrigin} /></View>;
  if (loading) return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>{header}<ScreenState loading message={t("ui.loading")} /></SafeAreaView>;
  if (loadError || notFound || !match) {
    return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>{header}
      <ScreenState error={loadError} message={t(loadError ? "ui.loadError" : "ui.notFound")} onRetry={load} retryLabel={t("ui.retry")} />
    </SafeAreaView>;
  }

  const players = [...match.players].sort((a, b) => (a.rankPosition ?? 99) - (b.rankPosition ?? 99));
  const isMine = (userId: string) => userId === currentUser?.id;
  const won = (p: (typeof players)[number]) => (match.result != null ? p.outcome === "Win" : p.isWinner);
  const participant = players.some(p => isMine(p.userId));
  const mode = match.gameMode ? t(match.gameMode === "SOLO" ? "modes.solo" : match.gameMode === "COOPERATIVE" ? "modes.cooperative" : "modes.multiplayer") : t("outcomes.modeUnknown");
  const facts = [formatDateTime(match.matchDate, i18n.language), mode,
    typeof match.durationInMinutes === "number" ? duration(match.durationInMinutes) : null, match.location || null].filter(Boolean).join(" · ");

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {header}
      <ScreenScroll contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <GameCover uri={match.gameImageUrl} size={96} />
          <View style={styles.heroText}>
            <Text style={type.title}>{match.gameName}</Text>
            <Text style={type.caption}>{facts}</Text>
            <TouchableOpacity style={styles.link} accessibilityRole="button" accessibilityLabel={t("ui.viewGame")} onPress={() => router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: match.gameId } } as never)}>
              <Text style={[type.body, strong, { color: colors.primary }]}>{t("ui.viewGame")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Hero style={styles.result}>
          <Glyph name={players.some(won) ? "trophy" : "flag-checkered"} size={22} color={colors.primary} />
          <Text style={[type.head, styles.flex]}>{matchResultText(match, t)}</Text>
        </Hero>

        <Section title={t("steps.players")} note={String(players.length)}>
          <Card>
            {players.map((p, index) => <Row key={p.id ?? p.userId} first={index === 0} inset={68} strongTitle
              lead={<View><Avatar name={p.userName ?? "?"} />{won(p) && <View style={styles.winner}><Glyph name="trophy" size={12} color={colors.onPrimary} /></View>}</View>}
              title={isMine(p.userId) ? t("players.youNamed", { name: p.userName ?? t("players.player") }) : p.userName ?? t("players.player")}
              subtitle={p.outcome ? t(`outcomes.${p.outcome}`) : t("outcomes.legacyUnknown")}
              value={typeof p.score === "number" ? String(p.score) : undefined}
              accessibilityLabel={[isMine(p.userId) ? t("players.you") : p.userName, p.outcome ? t(`outcomes.${p.outcome}`) : t("outcomes.legacyUnknown"), typeof p.score === "number" ? t("ui.points", { score: p.score }) : null].filter(Boolean).join(", ")} />)}
          </Card>
        </Section>

        {!!match.scoreSummary && <Section title={t("ui.summary")}><Card padded><Text style={type.body}>{match.scoreSummary}</Text></Card></Section>}

        {participant && <Section title={t("ui.yourJournal")}>
          <Card>
            <Row first inset={52} lead={<Glyph name="star-outline" size={22} color={colors.pendingIcon} />} title={t("ui.openJournal")} subtitle={t("ui.openJournalHint")}
              onPress={() => router.push({ pathname: ROUTES.MATCH_JOURNAL, params: { id: match.id } } as never)} />
          </Card>
        </Section>}
      </ScreenScroll>
    </SafeAreaView>
  );
}

function duration(minutes: number) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg },
  content: { paddingTop: space.xs },
  flex: { flex: 1, minWidth: 0 },
  hero: { flexDirection: "row", alignItems: "center", gap: space.lg },
  heroText: { flex: 1, minWidth: 0, gap: space.xs },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  result: { flexDirection: "row", alignItems: "center", gap: space.md },
  winner: { position: "absolute", right: -4, bottom: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card },
});
