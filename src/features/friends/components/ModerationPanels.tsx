/**
 * Administrators: «Pessoas» (open reports, «Arquivar» or «Suspender», and suspended accounts with «Levantar suspensão»)
 * and «Fotografias» (reported diary photos: «Manter», «Retirar da comunidade» when published — it stays with the players —
 * or «Remover da partida…», which deletes it from the diary after a confirmation; both with a reason the author sees).
 * Only the community copy is hidden automatically after several reports; a decision here is always possible.
 */
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import ScreenState from "@/src/ui/ScreenState";
import PrimaryButton from "@/src/ui/PrimaryButton";
import Sheet from "@/src/ui/Sheet";
import { OptionGroup } from "@/src/ui/Filters";
import { Card } from "@/src/ui/components";
import { formatDate } from "@/src/ui/format";
import { colors, radius, space, strong, type } from "@/src/ui/theme";
import JournalPhoto from "@/src/features/games/journal/components/JournalPhoto";
import communityService from "../services/communityService";
import { ModerationPerson, ModerationPhoto, PHOTO_REPORT_REASONS, PhotoReportReason, SuspensionPeriod } from "../types/Community";

function useList<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true); setError(false);
    try { setItems(await load()); } catch { setError(true); } finally { setLoading(false); }
  }, [load]);
  useEffect(() => { void reload(); }, [reload]);
  return { items, loading, error, reload };
}

const Pills = ({ entries, label }: { entries: [string, number | undefined][]; label: (key: string) => string }) =>
  <View style={styles.reasons}>{entries.map(([r, n]) => <Text key={r} style={styles.reason}>{label(r)} · {n}</Text>)}</View>;

export function ModerationPeoplePanel() {
  const { t, i18n } = useTranslation("games");
  const { t: tf } = useTranslation("friends");
  const { items, loading, error, reload } = useList(communityService.moderationPeople);
  const [suspending, setSuspending] = useState<ModerationPerson | null>(null);
  const [period, setPeriod] = useState<"7" | "30" | "review">("7");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const act = async (action: () => Promise<void>) => { try { await action(); await reload(); } catch (err: any) { Alert.alert(t("moderation.title"), err?.message); } };
  const suspend = async () => {
    if (!suspending || !reason.trim() || saving) return;
    setSaving(true);
    const days: SuspensionPeriod = period === "review" ? null : Number(period) as 7 | 30;
    try { await communityService.suspend(suspending.userId, days, reason.trim()); setSuspending(null); setReason(""); setPeriod("7"); await reload(); }
    catch (err: any) { Alert.alert(t("moderation.suspend"), err?.message); }
    finally { setSaving(false); }
  };
  const lift = (person: ModerationPerson) => Alert.alert(t("moderation.liftTitle", { name: person.userName }), t("moderation.liftMessage"), [
    { text: t("experiences.cancel"), style: "cancel" },
    { text: t("moderation.lift"), onPress: () => act(() => communityService.liftSuspension(person.userId)) },
  ]);
  if (loading) return <ScreenState loading message="" />;
  if (error) return <ScreenState error message={t("moderation.loadError")} onRetry={reload} retryLabel={t("moderation.retry")} />;
  return <View style={styles.list}>
    <Text style={type.caption}>{items.length ? t("moderation.peopleCount", { count: items.length }) : t("moderation.peopleNone")}</Text>
    {items.map(person => <Card key={person.userId} padded>
      <View style={styles.item}>
        <Text style={[type.body, strong]}>{person.userName}</Text>
        {Object.keys(person.reasons).length > 0 && <Pills entries={Object.entries(person.reasons)} label={r => tf(`community.personReasons.${r}`)} />}
        {person.details.map((d, i) => <Text key={i} style={type.caption}>«{d}»</Text>)}
        {person.suspended && <Text style={[type.caption, { color: colors.danger }]}>{person.suspendedUntil
          ? t("moderation.suspendedUntil", { date: formatDate(person.suspendedUntil, i18n.language) }) : t("moderation.suspendedReview")}{person.suspensionReason ? ` · ${person.suspensionReason}` : ""}</Text>}
        <View style={styles.actions}>
          {person.suspended
            ? <View style={styles.flex}><PrimaryButton title={t("moderation.lift")} variant="secondary" onPress={() => lift(person)} /></View>
            : <>
              {Object.keys(person.reasons).length > 0 && <View style={styles.flex}><PrimaryButton title={t("moderation.archive")} variant="secondary" onPress={() => act(() => communityService.archive(person.userId))} /></View>}
              <View style={styles.flex}><PrimaryButton title={t("moderation.suspendAction")} onPress={() => setSuspending(person)} /></View>
            </>}
        </View>
      </View>
    </Card>)}
    <Sheet visible={!!suspending} title={t("moderation.suspend")} onClose={() => setSuspending(null)} closeLabel={t("experiences.cancel")}
      left={{ label: t("experiences.cancel"), onPress: () => setSuspending(null) }} right={{ label: t("moderation.suspendConfirm"), onPress: suspend, bold: true, disabled: !reason.trim() || saving }}>
      <View style={{ gap: space.md }}>
        <Text style={type.body}>{suspending?.userName}</Text>
        <OptionGroup title={t("moderation.period")} selected={[period]} onChange={next => next[0] && setPeriod(next[0])}
          options={[{ key: "7", label: t("moderation.days7") }, { key: "30", label: t("moderation.days30") }, { key: "review", label: t("moderation.untilReview") }]} />
        <TextInput style={styles.input} value={reason} onChangeText={v => setReason(v.slice(0, 300))} placeholder={t("moderation.suspendReason")}
          placeholderTextColor={colors.placeholder} multiline maxLength={300} accessibilityLabel={t("moderation.suspendReason")} />
        <Text style={type.caption}>{t("moderation.suspendNote")}</Text>
      </View>
    </Sheet>
  </View>;
}

export function ModerationPhotosPanel() {
  const { t } = useTranslation("games");
  const { t: tm } = useTranslation("matches");
  const { items, loading, error, reload } = useList(communityService.moderationPhotos);
  // «Retirar da comunidade» / «Remover da partida…»: the reason first (the author sees it); removing also asks for confirmation.
  const [deciding, setDeciding] = useState<{ photo: ModerationPhoto; decision: "withdraw" | "remove" } | null>(null);
  const [reason, setReason] = useState<PhotoReportReason | null>(null);
  const act = async (photo: ModerationPhoto, decision: "keep" | "withdraw" | "remove", why?: PhotoReportReason) => {
    try { await communityService.moderatePhoto(photo, decision, why); setDeciding(null); setReason(null); await reload(); }
    catch (err: any) { Alert.alert(t("moderation.title"), err?.message); }
  };
  const confirm = () => {
    if (!deciding || !reason) return;
    const { photo, decision } = deciding;
    if (decision === "withdraw") { void act(photo, "withdraw", reason); return; }
    Alert.alert(t("moderation.removePhotoTitle"), t("moderation.removePhotoMessage", { name: photo.ownerName }), [
      { text: t("experiences.cancel"), style: "cancel" },
      { text: t("moderation.removeFromMatch"), style: "destructive", onPress: () => act(photo, "remove", reason) },
    ]);
  };
  if (loading) return <ScreenState loading message="" />;
  if (error) return <ScreenState error message={t("moderation.loadError")} onRetry={reload} retryLabel={t("moderation.retry")} />;
  return <View style={styles.list}>
    <Text style={type.caption}>{items.length ? t("moderation.photosCount", { count: items.length }) : t("moderation.photosNone")}</Text>
    {items.map(photo => <Card key={`${photo.journalEntryId}-${photo.photoKey}`} padded>
      <View style={styles.item}>
        {photo.present ? <JournalPhoto uri={photo.imagePath} style={styles.photo} /> : <Text style={type.caption}>{t("moderation.photoGone")}</Text>}
        <View style={styles.head}>
          <Text style={[type.body, strong, styles.shrink]}>{t("moderation.photoOf", { name: photo.ownerName })}</Text>
          {photo.published && <Text style={styles.public}>{t("moderation.public")}</Text>}
        </View>
        <Pills entries={Object.entries(photo.reasons)} label={r => tm(`photos.reasons.${r}`)} />
        {photo.autoHidden && <Text style={type.caption}>{t("moderation.hiddenFromCommunity")}</Text>}
        {photo.details.map((d, i) => <Text key={i} style={type.caption}>«{d}»</Text>)}
        <View style={styles.actions}>
          <View style={styles.flex}><PrimaryButton title={t("moderation.keep")} variant="secondary" onPress={() => act(photo, "keep")} /></View>
          {photo.published && <View style={styles.flex}><PrimaryButton title={t("moderation.withdrawFromCommunity")} variant="secondary" onPress={() => { setReason(null); setDeciding({ photo, decision: "withdraw" }); }} /></View>}
        </View>
        {photo.present && <PrimaryButton title={t("moderation.removeFromMatchAction")} variant="danger" onPress={() => { setReason(null); setDeciding({ photo, decision: "remove" }); }} />}
        {photo.present && <Text style={type.micro}>{t(photo.published ? "moderation.photoActionsNote" : "moderation.photoRemoveNote")}</Text>}
      </View>
    </Card>)}
    <Sheet visible={!!deciding} title={deciding?.decision === "withdraw" ? t("moderation.withdrawFromCommunity") : t("moderation.removeFromMatch")}
      onClose={() => setDeciding(null)} closeLabel={t("experiences.cancel")} left={{ label: t("experiences.cancel"), onPress: () => setDeciding(null) }}
      right={{ label: t("moderation.confirm"), onPress: confirm, disabled: !reason, bold: true }}>
      <View style={{ gap: space.md }}>
        <Text style={type.caption}>{t("moderation.photoReasonHint")}</Text>
        <OptionGroup title={t("moderation.reason")} options={PHOTO_REPORT_REASONS.map(r => ({ key: r, label: tm(`photos.reasons.${r}`) }))} selected={reason ? [reason] : []}
          onChange={next => setReason(next[0] ?? null)} />
      </View>
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: space.lg },
  item: { gap: space.sm },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reason: { ...type.micro, ...strong, color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  actions: { flexDirection: "row", gap: space.sm },
  head: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm },
  shrink: { flexShrink: 1 },
  public: { ...type.micro, ...strong, color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  flex: { flex: 1 },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: colors.line },
  input: { minHeight: 64, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background, padding: space.md, ...type.body },
});
