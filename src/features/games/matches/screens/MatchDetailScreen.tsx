/**
 * Factual summary of a match, the same for everyone who can see it: game, date, mode,
 * result, players with outcomes and scores, and the shared summary. Participants also
 * see «A tua avaliação» right after the result: once given it is closed, with the private note and publishing as
 * secondary actions; before that, «Avaliar». The note opens the diary on the private field. «Avaliações da partida: 2 de 3 ↓»
 * moves this page down to «Outros jogadores» (approved 18/10/2026): the other players' rating, tags and photos — never
 * their notes — open in a sheet, and «Fotografias da partida» gathers everyone's photos with their author. The diary only
 * holds your own. The duration shows how it was obtained; the match creator can correct it (same permission as editing the match).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, LayoutChangeEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import JournalPhoto from "../../journal/components/JournalPhoto";
import ReasonReportSheet from "@/src/features/friends/components/ReasonReportSheet";
import communityService from "@/src/features/friends/services/communityService";
import { PHOTO_REPORT_REASONS } from "@/src/features/friends/types/Community";

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
  // New state goes after the existing state.
  const [viewingPlayer, setViewingPlayer] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; name: string; mine: boolean } | null>(null);
  const [reportingPhoto, setReportingPhoto] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Where «Outros jogadores» is right now: measured on every layout (the rating card and photos arrive later and push it down).
  const othersY = useRef<number | null>(null);
  const scrollWhenMeasured = useRef(false);

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
  // Your rating only: your diary, or an old rating stored on a match you registered (the API decides). Zero is a rating.
  const ownRating = myEntry?.personalRating ?? match.personalRating ?? null;
  const rated = ownRating != null;
  const ratedCount = (entries ?? []).filter(e => e.personalRating != null && players.some(p => p.userId === e.userId)).length;
  const value = rated ? new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(ownRating!) : null;
  const openJournal = () => router.push({ pathname: ROUTES.MATCH_JOURNAL, params: { id: match.id } } as never);
  const openNote = () => router.push({ pathname: ROUTES.MATCH_JOURNAL, params: { id: match.id, focus: "note" } } as never);
  const scrollToOthers = () => {
    if (othersY.current == null) { scrollWhenMeasured.current = true; return; }
    scrollRef.current?.scrollTo({ y: Math.max(0, othersY.current - space.sm), animated: true });
  };
  const onOthersLayout = (e: LayoutChangeEvent) => {
    othersY.current = e.nativeEvent.layout.y;
    if (scrollWhenMeasured.current) { scrollWhenMeasured.current = false; scrollToOthers(); }
  };
  const others = players.filter(p => !isMine(p.userId));
  const entryOf = (userId: string) => entries?.find(e => e.userId === userId && players.some(p => p.userId === e.userId));
  // Everyone's photos, each with its author; yours say «Tu» and are not reported from here.
  const gallery = players.flatMap(p => (entryOf(p.userId)?.photoUrls ?? []).map(url => ({ url, mine: isMine(p.userId), name: p.userName ?? t("players.player") })));
  const viewed = viewingPlayer ? others.find(p => p.userId === viewingPlayer) : undefined;
  const viewedEntry = viewed ? entryOf(viewed.userId) : undefined;
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
      <ScreenScroll ref={scrollRef} contentContainerStyle={styles.content}>
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
          ratedCount={ratedCount} total={players.length} onOpenJournal={openJournal} onOpenNote={openNote} onShowOthers={scrollToOthers} onPublish={() => router.push({ pathname: ROUTES.MATCH_PUBLISH, params: { id: match.id } } as never)} />}

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

        {participant && entries && others.length > 0 && <View onLayout={onOthersLayout} testID="others-section">
          <Section title={t("others.title")}>
            <Text style={[type.caption, styles.caption]}>{t(rated ? "others.countWithYours" : "others.count", { rated: ratedCount, total: players.length })}</Text>
            <Card>
              {others.map((p, index) => {
                const entry = entryOf(p.userId);
                const summary = sharedSummary(entry, t);
                const name = p.userName ?? t("players.player");
                const rated = entry?.personalRating != null;
                const number = rated ? new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(entry!.personalRating!) : null;
                // Only a row with something shared opens (arrow); the rating alone is already on the row.
                const line = summary ? (rated ? summary : `${t("others.notRated")} · ${summary}`) : rated ? t("others.nothingShared") : t("others.nothing");
                return <Row key={p.userId} first={index === 0} inset={68} strongTitle lead={<Avatar name={name} />} title={name}
                  subtitle={line} value={number ? `${number} / 10` : undefined} onPress={summary ? () => setViewingPlayer(p.userId) : undefined}
                  accessibilityLabel={[name, number ? t("rating.spoken", { value: number }) : null, line].filter(Boolean).join(", ")}
                  accessibilityHint={summary ? t("others.openHint") : undefined} />;
              })}
            </Card>
          </Section>
        </View>}

        {participant && entries && <Section title={t("gallery.title")} note={gallery.length ? String(gallery.length) : undefined}>
          {gallery.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {gallery.map(photo => <TouchableOpacity key={photo.url} accessibilityRole="imagebutton" onPress={() => setViewingPhoto(photo)}
              accessibilityLabel={photo.mine ? t("gallery.openMine") : t("photos.open", { name: photo.name })}>
              <JournalPhoto uri={photo.url} style={styles.galleryPhoto} />
              <View style={styles.author}><Text numberOfLines={1} style={[type.micro, strong, { color: colors.text }]}>{photo.mine ? t("gallery.you") : firstName(photo.name)}</Text></View>
            </TouchableOpacity>)}
          </ScrollView> : <Card padded><Text style={type.caption}>{t("gallery.empty")}</Text></Card>}
          {gallery.length > 0 && <Text style={[type.micro, styles.caption]}>{t("gallery.footer")}</Text>}
        </Section>}

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
      {/* Another player's experience: what they share with the players (rating, tags, photos). Notes never reach this page. */}
      <Sheet visible={!!viewed} title={viewed ? t("others.sheetTitle", { name: viewed.userName ?? t("players.player") }) : ""} onClose={() => setViewingPlayer(null)} closeLabel={t("photos.close")}
        left={{ label: t("photos.close"), onPress: () => setViewingPlayer(null) }}>
        {viewed && <View style={{ gap: space.md }}>
          <Text style={type.caption}>{viewedEntry?.personalRating != null
            ? t("others.sheetRating", { value: new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(viewedEntry.personalRating) }) : t("others.notRated")}</Text>
          {!!viewedEntry?.tags?.trim() && <View style={{ gap: space.xs }}>
            <Text style={type.caption}>{t("others.tags")}</Text>
            <View style={styles.tags}>{splitTags(viewedEntry.tags).map(tag => <View key={tag} style={styles.tagChip}><Text style={styles.tagChipText}>#{tag}</Text></View>)}</View>
          </View>}
          {!!viewedEntry?.photoUrls?.length && <View style={{ gap: space.xs }}>
            <Text style={type.caption}>{t("others.photos")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
              {viewedEntry.photoUrls.map(url => <TouchableOpacity key={url} accessibilityRole="imagebutton" accessibilityLabel={t("photos.open", { name: viewed.userName ?? t("players.player") })}
                onPress={() => { setViewingPlayer(null); setViewingPhoto({ url, name: viewed.userName ?? t("players.player"), mine: false }); }}>
                <JournalPhoto uri={url} style={styles.galleryPhoto} />
              </TouchableOpacity>)}
            </ScrollView>
          </View>}
        </View>}
      </Sheet>
      <Sheet visible={!!viewingPhoto} title={viewingPhoto ? (viewingPhoto.mine ? t("gallery.viewerMine") : t("photos.viewerOf", { name: viewingPhoto.name })) : t("photos.viewer")}
        onClose={() => setViewingPhoto(null)} closeLabel={t("photos.close")} left={{ label: t("photos.close"), onPress: () => setViewingPhoto(null) }}>
        <View style={{ gap: space.md }}>
          {viewingPhoto && <JournalPhoto uri={viewingPhoto.url} style={styles.photoLarge} />}
          {viewingPhoto && !viewingPhoto.mine && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("photos.report")} style={styles.reportPhoto}
            onPress={() => { setReportingPhoto(viewingPhoto.url); setViewingPhoto(null); }}>
            <Glyph name="flag-outline" size={20} color={colors.danger} />
            <Text style={[type.body, { color: colors.danger }]}>{t("photos.report")}</Text>
          </TouchableOpacity>}
        </View>
      </Sheet>
      <ReasonReportSheet visible={!!reportingPhoto} title={t("photos.reportTitle")} reasons={PHOTO_REPORT_REASONS} label={r => t(`photos.reasons.${r}`)}
        detailLabel={t("photos.reportDetail")} note={t("photos.reportNote")} cancelLabel={t("photos.cancel")} sendLabel={t("photos.send")}
        onClose={() => setReportingPhoto(null)}
        onSend={async (reason, detail) => { if (!reportingPhoto) return; await communityService.reportPhoto(reportingPhoto, reason, detail); setReportingPhoto(null); Alert.alert(t("photos.reportTitle"), t("photos.reported")); }} />
    </SafeAreaView>
  );
}

/** «A tua avaliação» on the match page: the saved (closed) rating or the call to rate, the personal note and the publication. */
function RatingCard({ rated, value, notes, publishLine, hidden, ratedCount, total, onOpenJournal, onOpenNote, onShowOthers, onPublish }: {
  rated: boolean; value: string | null; notes: string | null; publishLine: string | null; hidden: boolean;
  ratedCount: number; total: number; onOpenJournal: () => void; onOpenNote: () => void; onShowOthers: () => void; onPublish: () => void;
}) {
  const { t } = useTranslation("matches");
  return <View style={styles.ratingCard}>
    <View style={styles.ratingHead}>
      <Text style={styles.ratingLabel}>{t("detailCard.label")}</Text>
      {rated && <View style={styles.lockBadge}><Glyph name="lock-outline" size={13} color={colors.muted} /><Text style={[type.micro, strong]}>{t("detailCard.saved")}</Text></View>}
    </View>
    <Text style={[styles.ratingValue, !rated && { color: colors.empty }]} accessibilityLabel={value ? t("rating.spoken", { value }) : t("rating.notRated")}>{value ?? "—"}<Text style={styles.ratingScale}> / 10</Text></Text>
    <Text style={type.caption}>{rated ? t("detailCard.savedHint") : t("detailCard.notRated")}</Text>
    <Text style={type.caption}>{t("detailCard.visibleToPlayers")}</Text>
    {rated ? <>
      <View style={styles.hr} />
      <Row first inset={52} lead={<Glyph name="lock-outline" size={20} color={notes ? colors.muted : colors.primary} />}
        title={notes ? t("detailCard.noteSet") : t("detailCard.addNote")} subtitle={notes ? `${t("detailCard.onlyYou")} · ${notes}` : t("detailCard.onlyYou")}
        tone={notes ? "default" : "link"} onPress={onOpenNote} />
      <Row inset={52} lead={<Glyph name={publishLine && !hidden ? "earth" : "comment-text-outline"} size={20} color={colors.icon} />}
        title={publishLine ?? t("diary.publish")} subtitle={publishLine ? undefined : t("diary.optional")}
        onPress={onPublish} />
    </> : <PrimaryButton title={t("detailCard.rate")} icon={<Glyph name="star" size={18} color={colors.onPrimary} />} onPress={onOpenJournal} />}
    {/* The other players' experiences are further down this page; the shortcut moves there (it does not open the diary). */}
    {total > 1 && <Row inset={52} lead={<Glyph name="account-multiple-outline" size={20} color={colors.icon} />} title={t("detailCard.othersCount", { rated: ratedCount, total })}
      subtitle={t("detailCard.othersHere")} end="down" onPress={onShowOthers} accessibilityHint={t("detailCard.othersHint")} />}
  </View>;
}

const splitTags = (tags: string | null | undefined) => (tags ?? "").split(",").map(tag => tag.trim()).filter(Boolean);
const firstName = (name: string) => name.split(/\s+/)[0] || name;
/** «2 etiquetas · 2 fotografias» — what a player shares with the players; null when nothing. */
function sharedSummary(entry: JournalEntry | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  const tags = splitTags(entry?.tags).length, photos = entry?.photoUrls?.length ?? 0;
  if (!tags && !photos) return null;
  return [tags ? t("others.tagCount", { count: tags }) : t("others.noTags"), photos ? t("others.photoCount", { count: photos }) : t("others.noPhotos")].join(" · ");
}

const styles = StyleSheet.create({
  caption: { paddingHorizontal: space.lg },
  gallery: { gap: space.md, paddingHorizontal: space.lg },
  galleryPhoto: { width: 136, height: 136, borderRadius: 14, backgroundColor: colors.line },
  author: { position: "absolute", left: space.sm, bottom: space.sm, maxWidth: 136 - 2 * space.sm, backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  photoLarge: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: colors.line },
  reportPhoto: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 44 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagChip: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { ...type.micro, color: colors.primary, fontWeight: "600" },
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
