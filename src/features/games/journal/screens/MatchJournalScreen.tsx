/**
 * Diary of a match for one participant. The rating is the only thing it asks: 0–10 in half points, zero included,
 * given once — once saved it is closed (the API refuses another value). The personal note is optional and private;
 * tags and photos are seen by the match's players, as before. Publishing the experience is a separate, optional step.
 * Other participants rate whenever they like: their pending rating is shown as a discreet count, never a task.
 */
import JournalPhoto from "../components/JournalPhoto";
import { Glyph } from "@/src/ui/components";
import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import PrimaryButton from "@/src/ui/PrimaryButton";
import { formatDate } from "@/src/ui/format";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/ui/ScreenHeader";
import ScreenState from "@/src/ui/ScreenState";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView, Platform, View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";

import matchService from "@/src/features/games/matches/services/matchService";
import { MatchDto } from "@/src/features/games/matches/types/MatchForm";
import { JournalEntry } from "@/src/features/games/campaigns/types/Campaign";
import RatingControl from "@/src/features/games/matches/components/RatingControl";
import Sheet from "@/src/ui/Sheet";
import experienceService from "@/src/features/games/experiences/services/experienceService";
import { Publication } from "@/src/features/games/experiences/types/Experience";
import ReasonReportSheet from "@/src/features/friends/components/ReasonReportSheet";
import communityService from "@/src/features/friends/services/communityService";
import { PHOTO_REPORT_REASONS } from "@/src/features/friends/types/Community";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { RootState } from "@/src/store/store";
import { ROUTES } from "@/src/constants/routes";

export default function MatchJournalScreen() {
  const { t, i18n } = useTranslation("matches");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [match, setMatch] = useState<MatchDto | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loadError, setLoadError] = useState(false);
  // New state goes after the existing state.
  const [confirming, setConfirming] = useState(false);
  const [publication, setPublication] = useState<Publication | null>(null);
  // Another participant's photo, opened larger; from there it can be reported (nothing is removed automatically).
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; name: string } | null>(null);
  const [reportingPhoto, setReportingPhoto] = useState<string | null>(null);

  const myEntry = entries.find(e => e.userId === currentUser?.id);
  // Your diary rating or, on an old match you registered without any diary, the rating stored on it (the API decides).
  const savedRating = myEntry?.personalRating ?? match?.personalRating ?? null;
  const alreadySubmitted = savedRating != null;
  const myPhotos = myEntry?.photoUrls ?? [];
  const myPhotoCount = myPhotos.length + (myEntry?.unavailablePhotoCount ?? 0);
  const MAX_PHOTOS = 5;
  const totalPlayers = match?.players?.length ?? 0;
  const ratedCount = entries.filter(e => e.personalRating != null && match?.players?.some(p => p.userId === e.userId)).length;
  const locale = i18n.language === "pt" ? "pt-PT" : "en-GB";
  const number = (v: number) => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(v);

  const savedDraft = useRef(JSON.stringify([undefined, "", ""]));
  const dirty = JSON.stringify([alreadySubmitted ? savedRating ?? undefined : personalRating, notes, tags]) !== savedDraft.current;
  const navigationGuard = useUnsavedChanges(!loading && dirty, saving || uploadingPhoto, "/games/pending-journal");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoadError(false);
      setLoading(true);
      const [matchData, entriesData] = await Promise.all([matchService.getById(id), matchService.getJournalEntries(id)]);
      setMatch(matchData);
      setEntries(entriesData);
      const mine = entriesData.find(e => e.userId === currentUser?.id);
      savedDraft.current = JSON.stringify([mine?.personalRating ?? undefined, mine?.notes ?? "", mine?.tags ?? ""]);
      if (mine) {
        setPersonalRating(mine.personalRating ?? undefined);
        setNotes(mine.notes ?? "");
        setTags(mine.tags ?? "");
      }
      if (mine?.personalRating != null) experienceService.getMine(id).then(setPublication).catch(() => setPublication(null));
    } catch {
      setLoadError(true);
      Alert.alert(t("ui.error"), t("ui.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  // A new rating is confirmed first; texts alone are saved straight away (the saved rating is sent unchanged).
  const save = async (rating: number | null) => {
    if (!id) return;
    setSaving(true);
    try {
      await matchService.upsertJournalEntry(id, { personalRating: rating, notes: notes.trim() || null, tags: tags.trim() || null });
      savedDraft.current = JSON.stringify([rating ?? undefined, notes, tags]);
      setConfirming(false);
      await load();
    } catch (err: any) {
      Alert.alert(t("ui.error"), err?.message ?? t("journal.saveError"));
    } finally {
      setSaving(false);
    }
  };
  const handleSave = () => {
    if (alreadySubmitted) return save(savedRating);
    if (personalRating !== undefined) { setConfirming(true); return; }
    return save(null);
  };

  const handlePickPhoto = async () => {
    if (!id) return;
    if (myPhotoCount >= MAX_PHOTOS) { Alert.alert(t("photos.limitTitle"), t("photos.limit", { count: MAX_PHOTOS })); return; }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("photos.permissionTitle"), t("photos.permission")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: false });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploadingPhoto(true);
    try { await matchService.uploadJournalPhoto(id, result.assets[0].uri); await load(); }
    catch (err: any) { Alert.alert(t("ui.error"), err?.message ?? t("photos.uploadError")); }
    finally { setUploadingPhoto(false); }
  };

  const handleRemovePhoto = (url: string) => {
    if (!id) return;
    Alert.alert(t("photos.removeTitle"), t("photos.removeConfirm"), [
      { text: t("journal.cancel"), style: "cancel" },
      { text: t("journal.remove"), style: "destructive", onPress: async () => {
        try { await matchService.removeJournalPhoto(id, url); await load(); }
        catch (err: any) { Alert.alert(t("ui.error"), err?.message ?? t("photos.removeError")); }
      } },
    ]);
  };

  const header = <View style={styles.header}><ScreenHeader mode="cancel" title={t("diary.title")} onLeftPress={navigationGuard.cancel} /></View>;
  if (loading) return <SafeAreaView style={styles.screen}>{header}<ScreenState loading message={t("ui.loading")} /></SafeAreaView>;
  if (!match || loadError) return <SafeAreaView style={styles.screen}>{header}<ScreenState error={loadError} message={t(loadError ? "ui.loadError" : "ui.notFound")} onRetry={load} retryLabel={t("ui.retry")} /></SafeAreaView>;

  const others = entries.filter(e => e.userId !== currentUser?.id);
  const saved = myEntry?.createdAt ? new Date(myEntry.createdAt) : null;
  const savedOn = saved ? formatDate(saved, i18n.language) : "";
  const publicationLine = publication?.hidden ? t("diary.hidden")
    : publication?.showRating && publication.commentPublished ? t("diary.publishedBoth")
    : publication?.showRating ? t("diary.publishedRating") : publication?.commentPublished ? t("diary.publishedComment")
    : publication?.comment ? t("diary.draft") : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
    {header}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardDismissMode="on-drag" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={type.title}>{match.gameName}</Text>
        <Text style={type.caption}>{[new Date(match.matchDate).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }),
          totalPlayers ? t("diary.ratedCount", { rated: ratedCount, total: totalPlayers }) : null].filter(Boolean).join(" · ")}</Text>
      </View>

      {alreadySubmitted ? <View style={styles.card}>
        <View style={styles.row}>
          <Text style={[type.head, styles.flex]}>{t("diary.yourRating")}</Text>
          <View style={styles.badge}><Glyph name="lock-outline" size={14} color={colors.muted} /><Text style={[type.micro, strong]}>{t("diary.locked")}</Text></View>
        </View>
        <Text style={styles.score} accessibilityLabel={t("rating.spoken", { value: number(savedRating!) })}>{number(savedRating!)}<Text style={styles.scale}> / 10</Text></Text>
        <Text style={type.caption}>{savedOn ? t("diary.lockedHint", { date: savedOn }) : t("diary.lockedLegacy")}</Text>
        <Text style={type.caption}>{t("diary.visibleToPlayers")}</Text>
      </View> : <View style={{ gap: space.xs }}>
        <RatingControl value={personalRating} onChange={setPersonalRating} note={t("diary.ruleNote")} />
        <Text style={[type.caption, { paddingHorizontal: space.xs }]}>{t("diary.visibleToPlayers")}</Text>
      </View>}

      <View style={styles.card}>
        <View style={styles.row}>
          <Glyph name="lock-outline" size={18} color={colors.muted} />
          <Text style={[type.head, styles.flex]}>{t("diary.note")}</Text>
          <View style={styles.badge}><Text style={[type.micro, strong]}>{t("diary.onlyYou")}</Text></View>
        </View>
        <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder={t("diary.notePlaceholder")} accessibilityLabel={t("diary.note")}
          placeholderTextColor={colors.placeholder} multiline numberOfLines={4} textAlignVertical="top" maxLength={2000} />
      </View>

      <View style={styles.card}>
        <View style={styles.row}><Glyph name="account-multiple" size={18} color={colors.icon} /><Text style={[type.head, styles.flex]}>{t("diary.shared")}</Text></View>
        <Text style={type.caption}>{t("diary.sharedHint")}</Text>
        <TextInput style={[styles.input, { minHeight: touch + 2 }]} value={tags} onChangeText={setTags} placeholder={t("journal.tagsPlaceholder")} accessibilityLabel={t("journal.tags")}
          placeholderTextColor={colors.placeholder} maxLength={500} />
        {tags.trim() !== "" && <View style={styles.tags}>{tags.split(",").filter(tag => tag.trim()).map((tag, ti) => <View key={ti} style={styles.tagChip}><Text style={styles.tagChipText}>#{tag.trim()}</Text></View>)}</View>}
        <Text style={[type.caption, strong, { color: colors.text }]}>{t("photos.label")} {myPhotoCount > 0 ? `— ${myPhotoCount}/${MAX_PHOTOS}` : ""}</Text>
        {!!myEntry?.unavailablePhotoCount && <Text style={type.caption}>{t("photos.legacyUnavailable", { count: myEntry.unavailablePhotoCount })}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {myPhotos.map((url, pi) => <View key={pi} style={styles.photoThumbWrap}>
            <JournalPhoto uri={url} style={styles.photoThumb} />
            <TouchableOpacity style={styles.photoRemoveBtn} accessibilityRole="button" accessibilityLabel={t("photos.remove")} onPress={() => handleRemovePhoto(url)}>
              <Glyph name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </View>)}
          {myPhotoCount < MAX_PHOTOS && <TouchableOpacity style={styles.photoAddBtn} accessibilityRole="button" accessibilityLabel={t("photos.add")}
            accessibilityState={{ disabled: uploadingPhoto, busy: uploadingPhoto }} onPress={handlePickPhoto} disabled={uploadingPhoto} activeOpacity={0.8}>
            {uploadingPhoto ? <ActivityIndicator color={colors.primary} size="small" /> : <>
              <Glyph name="camera-plus-outline" size={20} color={colors.primary} />
              <Text style={styles.photoAddText}>{t("photos.add")}</Text>
            </>}
          </TouchableOpacity>}
        </ScrollView>
      </View>

      {alreadySubmitted && <TouchableOpacity style={[styles.card, styles.row]} accessibilityRole="button"
        onPress={() => router.push({ pathname: ROUTES.MATCH_PUBLISH, params: { id: match.id } } as never)}>
        <Glyph name={!publication?.hidden && (publication?.showRating || publication?.commentPublished) ? "earth" : "comment-text-outline"} size={20} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={[type.body, strong]}>{t("diary.publish")}</Text>
          <Text style={type.caption}>{publicationLine ?? t("diary.optional")}</Text>
        </View>
        <Glyph name="chevron-right" size={20} color={colors.chevron} />
      </TouchableOpacity>}

      {others.length > 0 && <View style={{ gap: space.sm }}>
        <Text style={type.head}>{t("diary.others")}</Text>
        <View style={[styles.card, { gap: 0, paddingVertical: space.xs }]}>
          {others.map((entry, i) => <View key={entry.id} style={[styles.entry, i > 0 && styles.divider]}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{entry.userName[0]?.toUpperCase()}</Text></View>
            <View style={styles.flex}>
              <Text style={[type.body, strong]}>{entry.userName}</Text>
              {!!entry.tags && <Text style={type.caption}>{entry.tags.split(",").map(tag => `#${tag.trim()}`).join(" ")}</Text>}
              {entry.personalRating == null && <Text style={type.caption}>{t("diary.notRatedYet")}</Text>}
              {!!entry.photoUrls?.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.xs }}>
                {entry.photoUrls.map((url, pi) => <TouchableOpacity key={pi} accessibilityRole="imagebutton" accessibilityLabel={t("photos.open", { name: entry.userName })}
                  onPress={() => setViewingPhoto({ url, name: entry.userName })}><JournalPhoto uri={url} style={styles.photoThumbSmall} /></TouchableOpacity>)}
              </ScrollView>}
            </View>
            {entry.personalRating != null && <Text style={[type.body, strong]}>{number(entry.personalRating)} / 10</Text>}
          </View>)}
        </View>
        <Text style={type.micro}>{t("diary.eachWhenever")}</Text>
      </View>}
    </ScrollView>
    <View style={styles.footer}>
      <PrimaryButton title={!alreadySubmitted && personalRating !== undefined ? t("diary.confirmRating") : t("diary.save")} onPress={handleSave} loading={saving} disabled={!dirty} />
    </View>
    </KeyboardAvoidingView>
    <Sheet visible={confirming} title={t("diary.confirmTitle")} onClose={() => setConfirming(false)} closeLabel={t("diary.adjust")}>
      <View style={styles.confirm}>
        <Text style={[styles.score, styles.center]}>{personalRating !== undefined ? number(personalRating) : "—"}<Text style={styles.scale}> / 10</Text></Text>
        <Text style={[type.body, styles.center]}>{t("diary.confirmText")}</Text>
        <PrimaryButton title={t("diary.confirmSave")} onPress={() => save(personalRating ?? null)} loading={saving} />
        <PrimaryButton title={t("diary.adjust")} variant="secondary" onPress={() => setConfirming(false)} />
      </View>
    </Sheet>
    <Sheet visible={!!viewingPhoto} title={viewingPhoto ? t("photos.viewerOf", { name: viewingPhoto.name }) : t("photos.viewer")} onClose={() => setViewingPhoto(null)} closeLabel={t("photos.close")}
      left={{ label: t("photos.close"), onPress: () => setViewingPhoto(null) }}>
      <View style={{ gap: space.md }}>
        {viewingPhoto && <JournalPhoto uri={viewingPhoto.url} style={styles.photoLarge} />}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("photos.report")} style={styles.reportPhoto} onPress={() => { setReportingPhoto(viewingPhoto?.url ?? null); setViewingPhoto(null); }}>
          <Glyph name="flag-outline" size={20} color={colors.danger} />
          <Text style={[type.body, { color: colors.danger }]}>{t("photos.report")}</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
    <ReasonReportSheet visible={!!reportingPhoto} title={t("photos.reportTitle")} reasons={PHOTO_REPORT_REASONS} label={r => t(`photos.reasons.${r}`)}
      detailLabel={t("photos.reportDetail")} note={t("photos.reportNote")} cancelLabel={t("photos.cancel")} sendLabel={t("photos.send")}
      onClose={() => setReportingPhoto(null)}
      onSend={async (reason, detail) => { if (!reportingPhoto) return; await communityService.reportPhoto(reportingPhoto, reason, detail); setReportingPhoto(null); Alert.alert(t("photos.reportTitle"), t("photos.reported")); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: 40, gap: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.track, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  score: { fontSize: 40, lineHeight: 46, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  scale: { fontSize: 17, fontWeight: "600", color: colors.muted },
  input: { minHeight: 96, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background, paddingHorizontal: space.md, paddingVertical: space.sm, ...type.body },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagChip: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { ...type.micro, color: colors.primary, fontWeight: "600" },
  entry: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.hair },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEE6F8", alignItems: "center", justifyContent: "center" },
  avatarText: { ...type.body, ...strong, color: colors.friend },
  photoThumb: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.line },
  photoLarge: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: colors.line },
  reportPhoto: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch },
  photoThumbSmall: { width: 64, height: 64, borderRadius: 10, marginRight: 8, backgroundColor: colors.line },
  photoThumbWrap: { position: "relative", marginRight: 12 },
  photoRemoveBtn: { position: "absolute", top: 0, right: 0, width: touch, height: touch, borderRadius: touch / 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)" },
  photoAddBtn: { width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  photoAddText: { ...type.caption, color: colors.primary, fontWeight: "700", marginTop: 4 },
  footer: { padding: space.lg, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background },
  confirm: { gap: space.md, paddingVertical: space.sm },
});
