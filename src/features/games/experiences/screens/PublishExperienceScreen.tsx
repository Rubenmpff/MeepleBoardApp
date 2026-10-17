/**
 * Publish an experience of a match, optional and explicit: show your (closed) rating with your name, publish a
 * comment, or both. The preview shows exactly what others see. Withdrawing the rating, withdrawing or deleting the
 * comment never changes the saved rating nor its contribution to the MeepleBoard average.
 */
import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { formatDate } from "@/src/ui/format";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import ScreenLayout from "@/src/ui/ScreenLayout";
import ScreenState from "@/src/ui/ScreenState";
import PrimaryButton from "@/src/ui/PrimaryButton";
import { Glyph } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { RootState } from "@/src/store/store";
import matchService from "@/src/features/games/matches/services/matchService";
import { MatchDto } from "@/src/features/games/matches/types/MatchForm";
import experienceService from "../services/experienceService";
import { Experience, Publication } from "../types/Experience";
import ExperienceCard from "../components/ExperienceCard";

const MAX = 500;

export default function PublishExperienceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation("matches");
  const user = useSelector((state: RootState) => state.auth.user);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [match, setMatch] = useState<MatchDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [publishComment, setPublishComment] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const apply = (p: Publication) => { setPublication(p); setShowRating(p.showRating); setPublishComment(p.commentPublished); setComment(p.comment ?? ""); };
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setLoadError(false);
    try { const [p, m] = await Promise.all([experienceService.getMine(id), matchService.getById(id)]); apply(p); setMatch(m); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <ScreenLayout title={t("publish.title")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;
  if (loadError || !publication || !match) return <ScreenLayout title={t("publish.title")}><ScreenState error message={t("ui.loadError")} onRetry={load} retryLabel={t("ui.retry")} /></ScreenLayout>;
  if (!publication.rated) return <ScreenLayout title={t("publish.title")}><ScreenState message={t("publish.needsRating")} /></ScreenLayout>;

  const number = (v: number) => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(v);
  const ratingText = number(publication.rating!);
  const text = comment.trim();
  const anythingPublished = publication.showRating || publication.commentPublished;
  const changed = showRating !== publication.showRating || publishComment !== publication.commentPublished || text !== (publication.comment ?? "");
  const mode: Experience["mode"] = match.gameMode === "SOLO" || match.gameMode === "COMPETITIVE" || match.gameMode === "COOPERATIVE" ? match.gameMode : match.isSoloGame ? "SOLO" : "UNKNOWN";
  const month = match.matchDate.slice(0, 7);
  const preview = { authorName: user?.userName ?? "", rating: showRating ? publication.rating : null, comment: publishComment && text ? text : null,
    mode, players: match.players?.length ?? 1, month, edited: false, isMine: true };
  const submit = async () => {
    if (!id) return;
    setSaving(true);
    try { apply(await experienceService.set(id, { showRating, comment: text || null, publishComment: publishComment && !!text })); }
    catch (err: any) { Alert.alert(t("ui.error"), err?.message ?? t("publish.error")); }
    finally { setSaving(false); }
  };
  const change = (kind: "withdraw-rating" | "withdraw-comment" | "delete-comment") => {
    const [title, body] = kind === "delete-comment" ? [t("publish.deleteTitle"), t("publish.deleteText")]
      : [t("publish.withdrawTitle"), t(kind === "withdraw-rating" ? "publish.withdrawRatingText" : "publish.withdrawCommentText")];
    Alert.alert(title, body, [{ text: t("publish.cancel"), style: "cancel" }, { text: kind === "delete-comment" ? t("publish.deleteComment") : t("publish.withdraw"), style: "destructive",
      onPress: async () => { if (!id) return; try { apply(await experienceService.change(id, kind)); } catch (err: any) { Alert.alert(t("ui.error"), err?.message ?? t("publish.error")); } } }]);
  };
  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void, hint?: string) =>
    <TouchableOpacity style={styles.toggle} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => onChange(!value)}>
      <View style={styles.flex}><Text style={type.body}>{label}</Text>{!!hint && <Text style={type.caption}>{hint}</Text>}</View>
      <View pointerEvents="none"><Switch value={value} accessible={false} trackColor={{ true: colors.primary, false: colors.track }} /></View>
    </TouchableOpacity>;
  const published = publication.publishedAt ? new Date(publication.publishedAt) : null;
  const publishedOn = published ? formatDate(published, i18n.language) : "";

  return <ScreenLayout title={anythingPublished ? t("publish.managed") : t("publish.title")}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      {publication.hidden && <View style={styles.hidden}>
        <View style={styles.row}><Glyph name="eye-off-outline" size={18} color={colors.danger} /><Text style={[type.body, strong, { color: colors.danger }]}>{t("publish.hidden")}</Text></View>
        <Text style={type.caption}>{t("publish.hiddenReason", { reason: t(`publish.reasons.${publication.hiddenReason ?? "Other"}`) })}</Text>
      </View>}
      {anythingPublished && !publication.hidden && <View style={styles.state}><Glyph name="earth" size={14} color={colors.primary} /><Text style={[type.micro, strong, { color: colors.primary }]}>{t("publish.publishedAt", { date: publishedOn })}</Text></View>}
      <View style={styles.card}>
        {toggle(t("publish.showRating", { value: ratingText }), showRating, setShowRating, t("publish.showRatingHint"))}
        <View style={styles.hr} />
        {toggle(t("publish.publishComment"), publishComment, setPublishComment)}
        {(publishComment || !!comment) && <>
          <TextInput style={styles.input} value={comment} onChangeText={v => setComment(v.slice(0, MAX))} placeholder={t("publish.commentPlaceholder")} placeholderTextColor={colors.placeholder}
            multiline maxLength={MAX} textAlignVertical="top" accessibilityLabel={t("publish.publishComment")} />
          <Text style={[type.micro, styles.right]}>{t("publish.counter", { count: comment.length })}</Text>
        </>}
      </View>
      {(preview.rating != null || preview.comment) && <View style={{ gap: space.sm }}>
        <Text style={styles.label}>{t("publish.preview")}</Text>
        <ExperienceCard item={preview} preview />
      </View>}
      {anythingPublished && <View style={styles.card}>
        {publication.showRating && <View style={styles.row}><Glyph name="star-outline" size={20} color={colors.icon} /><Text style={[type.body, styles.flex]}>{t("diary.publishedRating")}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => change("withdraw-rating")} style={styles.link}><Text style={styles.linkText}>{t("publish.withdraw")}</Text></TouchableOpacity></View>}
        {publication.commentPublished && <View style={styles.row}><Glyph name="comment-text-outline" size={20} color={colors.icon} /><Text style={[type.body, styles.flex]}>{t("diary.publishedComment")}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => change("withdraw-comment")} style={styles.link}><Text style={styles.linkText}>{t("publish.withdraw")}</Text></TouchableOpacity></View>}
      </View>}
      {!!publication.comment && <TouchableOpacity accessibilityRole="button" onPress={() => change("delete-comment")} style={styles.row}>
        <Glyph name="trash-can-outline" size={18} color={colors.danger} /><Text style={[type.body, strong, { color: colors.danger }]}>{t("publish.deleteComment")}</Text>
      </TouchableOpacity>}
      <Text style={type.caption}>{t("publish.keepNote", { value: ratingText })}</Text>
    </ScrollView>
    <View style={styles.footer}>
      <PrimaryButton title={showRating || (publishComment && !!text) ? t("publish.submit") : t("publish.saveDraft")} onPress={submit} loading={saving}
        disabled={!changed || (!showRating && !text) || (publishComment && !text)} />
    </View>
    </KeyboardAvoidingView>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  toggle: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 56 },
  hr: { height: 1, backgroundColor: colors.hair, marginHorizontal: -space.lg },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch },
  flex: { flex: 1, minWidth: 0 },
  input: { minHeight: 110, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background, padding: space.md, ...type.body },
  right: { textAlign: "right" },
  label: { ...type.micro, ...strong, letterSpacing: 0.4, textTransform: "uppercase" },
  link: { minHeight: touch, minWidth: touch, justifyContent: "center", alignItems: "flex-end" },
  linkText: { ...type.body, ...strong, color: colors.primary },
  state: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  hidden: { gap: space.xs, padding: space.md, borderRadius: radius.hero, backgroundColor: colors.dangerSoft },
  footer: { padding: space.lg, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background },
});
