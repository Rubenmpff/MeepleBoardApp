/**
 * Factual summary of a match, the same for everyone who can see it: game, date, mode,
 * result, players with outcomes and scores, and the shared summary. Participants also
 * see «A tua avaliação» right after the result: once given it is closed, with the private note and publishing as
 * secondary actions; before that, «Avaliar». The others' ratings are a discreet count, never a task. The duration shows how it was obtained; the match
 * creator can correct it (same permission as editing the match).
 */
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/ui/ScreenHeader";
import ScreenState from "@/src/ui/ScreenState";
import ScreenScroll from "@/src/ui/Screen";
import { Avatar, Card, Glyph, Hero, Row, Section } from "@/src/ui/components";
import Sheet from "@/src/ui/Sheet";
import { colors, space, strong, type } from "@/src/ui/theme";
import { formatDateTime, formatDuration } from "@/src/ui/format";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import GameCover from "@/src/ui/GameCover";
import { matchResultText } from "../../sessions/utils/matchResultKey";
import matchService from "../services/matchService";
import DurationField from "../components/DurationField";
import PrimaryButton from "@/src/ui/PrimaryButton";
import experienceService from "@/src/features/games/experiences/services/experienceService";
import { Publication } from "@/src/features/games/experiences/types/Experience";
import { JournalEntry } from "@/src/features/games/campaigns/types/Campaign";
import { checkDuration, DurationDraft, draftFrom, durationPayload, emptyDuration } from "../utils/matchDuration";
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
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationDraft, setDurationDraft] = useState<DurationDraft>(emptyDuration);
  const [savingDuration, setSavingDuration] = useState(false);
  const [durationError, setDurationError] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [publication, setPublication] = useState<Publication | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setNotFound(false); setLoadError(false); setLoading(true);
    try {
      const data = await matchService.getById(id); if (!data) setNotFound(true); setMatch(data);
      // The diary of a participant: own rating and the discreet count; failures leave the card out.
      matchService.getJournalEntries(id).then(setEntries).catch(() => setEntries(null));
      experienceService.getMine(id).then(setPublication).catch(() => setPublication(null));
    }
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
  const facts = [formatDateTime(match.matchDate, i18n.language), mode, match.location || null].filter(Boolean).join(" · ");
  const myEntry = entries?.find(e => e.userId === currentUser?.id);
  const rated = myEntry?.personalRating != null;
  const ratedCount = (entries ?? []).filter(e => e.personalRating != null && players.some(p => p.userId === e.userId)).length;
  const value = rated ? new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(myEntry!.personalRating!) : null;
  const openJournal = () => router.push({ pathname: ROUTES.MATCH_JOURNAL, params: { id: match.id } } as never);
  const publishLine = publication?.hidden ? t("diary.hidden") : publication?.showRating && publication.commentPublished ? t("diary.publishedBoth")
    : publication?.showRating ? t("diary.publishedRating") : publication?.commentPublished ? t("diary.publishedComment") : null;
  const isCreator = !!currentUser?.id && match.creatorId === currentUser.id;
  const method = match.durationMethod;
  const durationText = method === "Unknown" ? t("duration.reviewUnknown") : typeof match.durationInMinutes === "number"
    ? t("duration.review", { value: match.durationInMinutes > 0 ? formatDuration(match.durationInMinutes, i18n.language) : formatDuration(0, i18n.language),
      method: t(method === "Measured" ? "duration.reviewMeasured" : method === "Estimated" ? "duration.reviewEstimated" : "duration.reviewNotStated") })
    : t("duration.none");
  const draftCheck = checkDuration(durationDraft);
  const canSave = !savingDuration && (draftCheck.state === "unknown" || (draftCheck.state === "value" && (!draftCheck.unusual || durationDraft.confirmed)));
  const openDuration = () => { setDurationDraft(draftFrom(match.durationInMinutes, match.durationMethod ?? null)); setDurationError(false); setEditingDuration(true); };
  const saveDuration = async () => {
    if (!canSave) return;
    const payload = durationPayload(durationDraft);
    setSavingDuration(true); setDurationError(false);
    try {
      await matchService.updateDuration(match.id, payload.durationInMinutes ?? null, payload.durationMethod ?? null);
      setEditingDuration(false); await load();
    } catch { setDurationError(true); }
    finally { setSavingDuration(false); }
  };

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

        {participant && entries && <RatingCard rated={rated} value={value} notes={myEntry?.notes ?? null} publishLine={publishLine} hidden={!!publication?.hidden}
          ratedCount={ratedCount} total={players.length} onOpenJournal={openJournal} onPublish={() => router.push({ pathname: ROUTES.MATCH_PUBLISH, params: { id: match.id } } as never)} />}

        <Section title={t("steps.players")} note={String(players.length)}>
          <Card>
            {players.map((p, index) => <Row key={p.id ?? p.userId} first={index === 0} inset={68} strongTitle
              lead={<View><Avatar name={p.userName ?? "?"} />{won(p) && <View style={styles.winner}><Glyph name="trophy" size={12} color={colors.onPrimary} /></View>}</View>}
              title={isMine(p.userId) ? t("players.youNamed", { name: p.userName ?? t("players.player") }) : p.userName ?? t("players.player")}
              subtitle={p.outcome ? t(`outcomes.${p.outcome}`) : t("outcomes.noIndividualResult")}
              value={typeof p.score === "number" ? String(p.score) : undefined}
              accessibilityLabel={[isMine(p.userId) ? t("players.you") : p.userName, p.outcome ? t(`outcomes.${p.outcome}`) : t("outcomes.noIndividualResult"), typeof p.score === "number" ? t("ui.points", { score: p.score }) : null].filter(Boolean).join(", ")} />)}
          </Card>
        </Section>

        <Section title={t("summary.duration")}>
          <Card>
            <Row first title={durationText} lead={<Glyph name="timer-outline" size={22} color={colors.icon} />}
              subtitle={isCreator ? t("duration.edit") : undefined} onPress={isCreator ? openDuration : undefined}
              accessibilityLabel={isCreator ? `${durationText}. ${t("duration.edit")}` : durationText} />
          </Card>
        </Section>

        {!!match.scoreSummary && <Section title={t("ui.summary")}><Card padded><Text style={type.body}>{match.scoreSummary}</Text></Card></Section>}


      </ScreenScroll>
      <Sheet visible={editingDuration} title={t("duration.editTitle")} onClose={() => setEditingDuration(false)} closeLabel={t("duration.cancel")}
        left={{ label: t("duration.cancel"), onPress: () => setEditingDuration(false) }} right={{ label: t("duration.save"), onPress: saveDuration, disabled: !canSave, bold: true }}>
        <View style={{ gap: space.md }}>
          <DurationField value={durationDraft} onChange={setDurationDraft} required={false} />
          {durationError && <Text style={[type.caption, { color: colors.danger }]}>{t("duration.saveError")}</Text>}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

/** «A tua avaliação» on the match page: the saved (closed) rating or the call to rate, the personal note and the publication. */
function RatingCard({ rated, value, notes, publishLine, hidden, ratedCount, total, onOpenJournal, onPublish }: {
  rated: boolean; value: string | null; notes: string | null; publishLine: string | null; hidden: boolean;
  ratedCount: number; total: number; onOpenJournal: () => void; onPublish: () => void;
}) {
  const { t } = useTranslation("matches");
  return <View style={styles.ratingCard}>
    <View style={styles.ratingHead}>
      <Text style={styles.ratingLabel}>{t("detailCard.label")}</Text>
      {rated && <View style={styles.lockBadge}><Glyph name="lock-outline" size={13} color={colors.muted} /><Text style={[type.micro, strong]}>{t("detailCard.saved")}</Text></View>}
    </View>
    <Text style={[styles.ratingValue, !rated && { color: colors.empty }]} accessibilityLabel={value ? t("rating.spoken", { value }) : t("rating.notRated")}>{value ?? "—"}<Text style={styles.ratingScale}> / 10</Text></Text>
    <Text style={type.caption}>{rated ? t("detailCard.savedHint") : t("detailCard.notRated")}</Text>
    {rated ? <>
      <View style={styles.hr} />
      <Row first inset={52} lead={<Glyph name="lock-outline" size={20} color={notes ? colors.muted : colors.primary} />}
        title={notes ? t("detailCard.noteSet") : t("detailCard.addNote")} subtitle={notes ? `${t("detailCard.onlyYou")} · ${notes}` : undefined}
        tone={notes ? "default" : "link"} onPress={onOpenJournal} />
      <Row inset={52} lead={<Glyph name={publishLine && !hidden ? "earth" : "comment-text-outline"} size={20} color={colors.icon} />}
        title={publishLine ?? t("diary.publish")} subtitle={publishLine ? undefined : t("diary.optional")}
        onPress={onPublish} />
    </> : <PrimaryButton title={t("detailCard.rate")} icon={<Glyph name="star" size={18} color={colors.onPrimary} />} onPress={onOpenJournal} />}
    <Text style={type.micro}>{t("diary.ratedCount", { rated: ratedCount, total })}</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  ratingCard: { marginHorizontal: space.lg, marginBottom: space.lg, padding: space.lg, gap: space.sm, borderRadius: 16, borderCurve: "continuous", borderWidth: 1, borderColor: colors.pendingLine, backgroundColor: colors.pendingSoft },
  ratingHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ratingLabel: { ...type.micro, ...strong, letterSpacing: 0.4, textTransform: "uppercase" },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  ratingValue: { fontSize: 40, lineHeight: 46, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  ratingScale: { fontSize: 17, fontWeight: "600", color: colors.muted },
  hr: { height: 1, backgroundColor: colors.pendingLine, marginHorizontal: -space.lg },
  header: { paddingHorizontal: space.lg },
  content: { paddingTop: space.xs },
  flex: { flex: 1, minWidth: 0 },
  hero: { flexDirection: "row", alignItems: "center", gap: space.lg },
  heroText: { flex: 1, minWidth: 0, gap: space.xs },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  result: { flexDirection: "row", alignItems: "center", gap: space.md },
  winner: { position: "absolute", right: -4, bottom: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card },
});
