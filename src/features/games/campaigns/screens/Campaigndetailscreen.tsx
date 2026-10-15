/**
 * Campaign detail: summary, pending invitation, then Sessões / Membros / Notas.
 * Status changes and leaving live at the end of the page, each with a confirmation.
 */
import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import { CAMPAIGN_STATUS_COLORS } from "@/src/styles/statusColors";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import GameCover from "@/src/components/ui/GameCover";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions, View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, RefreshControl } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import campaignService from "@/src/features/games/campaigns/services/campaignService";
import { Campaign, CampaignMatch, JournalEntry, getCampaignStatusKey, getCampaignMemberStatusKey } from "@/src/features/games/campaigns/types/Campaign";
import { StarRating } from "@/src/shared/components/StarRating";
import { Avatar, Card, EmptyState, Note, Row, Section, Segmented, Glyph } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { formatRating } from "@/src/ui/format";
import { RootState } from "@/src/store/store";
type Tab = "matches" | "members" | "notes";
interface EntryDraft {
  personalRating?: number;
  notes: string;
  tags: string;
}
interface DaySession {
  dateKey: string;
  sessionNumber: number;
  matches: CampaignMatch[];
}
function groupMatchesByDay(matches: CampaignMatch[]): DaySession[] {
  const groups: Record<string, CampaignMatch[]> = {};
  matches.forEach((m) => {
    const key = new Date(m.matchDate).toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  Object.values(groups).forEach(arr =>
    arr.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
  );
  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  return keys.map((key, idx) => ({
    dateKey: key, sessionNumber: idx + 1, matches: groups[key],
  })).reverse();
}
export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { t, i18n } = useTranslation("campaigns");
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;
  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("matches");
  const [actionLoading, setActionLoading] = useState(false);
  const [journalEntries, setJournalEntries] = useState<Record<string, JournalEntry[]>>({});
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const selectedJournalMatch = useRef(expandedMatch);
  const [entryDraft, setEntryDraft] = useState<EntryDraft>({ notes: "", tags: "" });
  const [savingEntry, setSavingEntry] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [loadError, setLoadError] = useState(false);
  const currentEntry = expandedMatch ? journalEntries[expandedMatch]?.find(entry => entry.userId === currentUser?.id) : undefined;
  const entryDirty = !!expandedMatch && !!journalEntries[expandedMatch] && JSON.stringify([entryDraft.personalRating, entryDraft.notes, entryDraft.tags]) !== JSON.stringify([currentEntry?.personalRating ?? undefined, currentEntry?.notes ?? "", currentEntry?.tags ?? ""]);
  const navigationGuard = useUnsavedChanges((editingNotes && notesDraft !== (campaign?.notes ?? "")) || entryDirty, savingEntry || actionLoading, "/(app)/games/campaigns");
  const fetchCampaign = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      setLoadError(false);
      if (!silent) setLoading(true);
      const data = await campaignService.getById(id);
      setCampaign(data);
      setNotesDraft(data.notes ?? "");
    } catch {
      setLoadError(true);
      Alert.alert(t("common.error"), t("detail.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, t]);
  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);
  const isCreator = campaign?.creatorId === currentUser?.id;
  const isActive  = campaign?.status === "Active";
  const myMember  = useMemo(() => campaign?.members?.find(m => m.userId === currentUser?.id), [campaign, currentUser?.id]);
  const isMember  = myMember?.status === "Accepted";
  const isPending = myMember?.status === "Pending";
  const daySessions = useMemo(() => campaign ? groupMatchesByDay(campaign.matches) : [], [campaign]);
  const loadJournal = async (matchId: string) => {
    try {
      const entries = await campaignService.getJournalEntries(matchId);
      setJournalEntries(prev => ({ ...prev, [matchId]: entries }));
      const mine = entries.find(e => e.userId === currentUser?.id);
      if (selectedJournalMatch.current === matchId) setEntryDraft(mine
        ? { personalRating: mine.personalRating ?? undefined, notes: mine.notes ?? "", tags: mine.tags ?? "" }
        : { notes: "", tags: "" });
    } catch {
      if (selectedJournalMatch.current === matchId) {
        selectedJournalMatch.current = null;
        setExpandedMatch(null);
        Alert.alert(t("common.error"), t("detail.sessions.journalLoadError"));
      }
    }
  };
  const toggleMatch = async (matchId: string) => {
    if (expandedMatch === matchId) { selectedJournalMatch.current = null; setExpandedMatch(null); return; }
    selectedJournalMatch.current = matchId;
    setExpandedMatch(matchId);
    if (!journalEntries[matchId]) await loadJournal(matchId);
    else {
      const mine = journalEntries[matchId].find(e => e.userId === currentUser?.id);
      setEntryDraft(mine ? { personalRating: mine.personalRating ?? undefined, notes: mine.notes ?? "", tags: mine.tags ?? "" } : { notes: "", tags: "" });
    }
  };
  const saveEntry = async (matchId: string) => {
    setSavingEntry(true);
    try {
      await campaignService.upsertJournalEntry(matchId, {
        personalRating: entryDraft.personalRating ?? null,
        notes: entryDraft.notes.trim() || null,
        tags: entryDraft.tags.trim() || null,
      });
      await loadJournal(matchId);
      Alert.alert(t("detail.sessions.savedTitle"), t("detail.sessions.savedMessage"));
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message ?? t("detail.sessions.saveError"));
    } finally {
      setSavingEntry(false);
    }
  };
  const saveNotes = async () => {
    if (!id || !campaign) return;
    setActionLoading(true);
    try {
      await campaignService.update(id, { name: campaign.name, notes: notesDraft.trim() || undefined });
      setEditingNotes(false);
      await fetchCampaign(true);
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message ?? t("detail.loadError"));
    } finally {
      setActionLoading(false);
    }
  };
  const handleRespondInvite = async (accept: boolean) => {
    setActionLoading(true);
    try {
      await campaignService.respondInvite(id!, accept);
      await fetchCampaign(true);
    } catch (err: any) { Alert.alert(t("common.error"), err?.message ?? t("detail.loadError")); }
    finally { setActionLoading(false); }
  };
  const handleRemoveMember = (userId: string, userName: string) => {
    Alert.alert(t("detail.members.removeTitle"), t("detail.members.removeConfirm", { name: userName }), [
      { text: t("common.no"), style: "cancel" },
      { text: t("common.remove"), style: "destructive", onPress: async () => {
        try { await campaignService.removeMember(id!, userId); await fetchCampaign(true); }
        catch (err: any) { Alert.alert(t("common.error"), err?.message ?? t("detail.loadError")); }
      }},
    ]);
  };
  const handleLeave = () => {
    Alert.alert(t("detail.members.leaveTitle"), t("detail.members.leaveConfirm"), [
      { text: t("common.no"), style: "cancel" },
      { text: t("detail.members.leave"), style: "destructive", onPress: async () => {
        try { await campaignService.leave(id!); router.back(); }
        catch (err: any) { Alert.alert(t("common.error"), err?.message ?? t("detail.loadError")); }
      }},
    ]);
  };
  const confirmStatus = (title: string, message: string, confirmLabel: string, destructive: boolean, action: () => Promise<void>) =>
    Alert.alert(title, message, [
      { text: t("common.no"), style: "cancel" },
      { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: async () => {
        try { await action(); await fetchCampaign(true); }
        catch (err: any) { Alert.alert(t("common.error"), err?.message ?? t("detail.loadError")); }
      }},
    ]);
  if (loading) return <ScreenLayout title={t("ui.detailTitle")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;
  if (!campaign || loadError) return <ScreenLayout title={t("ui.detailTitle")}><ScreenState error={loadError} message={t(loadError ? "detail.loadError" : "detail.notFound")} onRetry={() => fetchCampaign()} retryLabel={t("ui.retry")} /></ScreenLayout>;
  const statusColor = CAMPAIGN_STATUS_COLORS[campaign.status];
  const facts = [t("list.members", { count: campaign.memberCount }), campaign.matchCount > 0 ? t("list.matches", { count: campaign.matchCount }) : null,
    campaign.averagePersonalRating != null ? `★ ${formatRating(campaign.averagePersonalRating, i18n.language)}` : null].filter(Boolean).join(" · ");
  const canManage = (isCreator && isActive) || (isMember && !isCreator);
  return (
    <ScreenLayout title={t("ui.detailTitle")} keyboard>
      <ScrollView
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCampaign(true); }} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View style={[styles.hero, compact && styles.heroStacked]}>
          <GameCover uri={campaign.gameImageUrl} size={72} />
          <View style={styles.flex}>
            <Text style={type.title}>{campaign.name}</Text>
            {!!campaign.gameName && <Text style={type.body}>{campaign.gameName}</Text>}
            <View style={styles.heroMeta}>
              <Text style={[styles.pill, { color: statusColor, backgroundColor: statusColor + "1F" }]}>{t(getCampaignStatusKey(campaign.status))}</Text>
              <Text style={type.caption}>{facts}</Text>
            </View>
          </View>
        </View>

        {isPending && <View style={styles.invite}>
          <Text style={[type.body, strong, { color: colors.pendingText }]}>{t("detail.invite.title")}</Text>
          <Text style={type.caption}>{t("detail.invite.message")}</Text>
          <View style={styles.actions}>
            <View style={styles.flex}><PrimaryButton title={t("detail.invite.accept")} loading={actionLoading} onPress={() => handleRespondInvite(true)} /></View>
            <View style={styles.flex}><PrimaryButton title={t("detail.invite.decline")} variant="secondary" disabled={actionLoading} onPress={() => handleRespondInvite(false)} /></View>
          </View>
        </View>}

        <Segmented items={[
          { key: "matches", label: t("detail.tabs.sessions", { count: daySessions.length }) },
          { key: "members", label: t("detail.tabs.members", { count: campaign.memberCount }) },
          { key: "notes", label: t("detail.tabs.notes") },
        ] as { key: Tab; label: string }[]} value={tab} onChange={setTab} />

        {tab === "matches" && <View style={styles.tabContent}>
          {isMember && <PrimaryButton title={t("detail.sessions.newEncounter")} icon={<Glyph name="plus" size={20} color={colors.onPrimary} />}
            onPress={() => router.push({
              pathname: "/(app)/games/campaigns/encounter/create" as any,
              params: {
                campaignId: campaign.id,
                gameId: campaign.gameId,
                gameName: campaign.gameName ?? "",
                memberNames: campaign.members.filter(m => m.status === "Accepted").map(m => m.userName).join(","),
                memberIds: campaign.members.filter(m => m.status === "Accepted").map(m => m.userId).join(","),
              }
            })} />}
          {daySessions.length === 0 ? <EmptyState title={t("detail.sessions.emptyTitle")} message={t("detail.sessions.emptyMessage")} />
            : daySessions.map(session => <Section key={session.dateKey} title={t("detail.sessions.session", { number: session.sessionNumber })}
              note={new Date(session.dateKey + "T00:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}>
              <Card>
                {session.matches.map((cm: CampaignMatch, index) => {
                  const isExp = expandedMatch === cm.matchId;
                  const entries = journalEntries[cm.matchId] ?? [];
                  const myEntry = entries.find(e => e.userId === currentUser?.id);
                  const title = cm.sessionTitle || cm.gameName || t("detail.sessions.encounter");
                  const readable = cm.canReadJournal === true;
                  return <View key={cm.id} style={index > 0 && styles.divider}>
                    <TouchableOpacity style={styles.matchHeader} disabled={!readable} onPress={() => entryDirty ? navigationGuard.discard(() => { void toggleMatch(cm.matchId); }) : void toggleMatch(cm.matchId)}
                      accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: isExp, disabled: !readable }}>
                      <View style={styles.flex}>
                        <Text style={[type.body, strong]}>{title}</Text>
                        <View style={styles.matchMeta}>
                          <Text style={type.caption}>{[cm.durationInMinutes ? `${cm.durationInMinutes} min` : null, journalEntries[cm.matchId] ? t("detail.sessions.ratings", { count: entries.length }) : null].filter(Boolean).join(" · ")}</Text>
                          {!myEntry && isMember && readable && <Text style={[styles.pill, styles.pending]}>{t("detail.sessions.evaluate")}</Text>}
                        </View>
                      </View>
                      {readable ? <Glyph name={isExp ? "chevron-up" : "chevron-down"} size={22} color={colors.chevron} /> : <Text style={type.caption}>{t("detail.sessions.participantsOnly")}</Text>}
                    </TouchableOpacity>
                    {isExp && readable && <View style={styles.journal}>
                      {entries.map((entry: JournalEntry) => <View key={entry.id} style={styles.entry}>
                        <Avatar name={entry.userName} size={32} />
                        <View style={[styles.flex, styles.entryBody]}>
                          <Text style={[type.body, strong]}>{entry.userName}</Text>
                          {entry.personalRating != null && <StarRating appearance="refresh" value={entry.personalRating} readonly size={14} showLabel={false} />}
                          {entry.userId === currentUser?.id && !!entry.notes && <Text style={[type.body, { color: colors.muted }]}>{entry.notes}</Text>}
                          {!!entry.tags && <View style={styles.tags}>
                            {entry.tags.split(",").map((tag, i) => <Text key={i} style={[styles.pill, styles.tag]}>#{tag.trim()}</Text>)}
                          </View>}
                        </View>
                      </View>)}
                      {isMember && <View style={styles.form}>
                        <Text style={type.head}>{myEntry ? t("detail.sessions.editRating") : t("detail.sessions.yourRating")}</Text>
                        <Text style={[type.caption, strong, styles.label]}>{t("detail.sessions.rating")}</Text>
                        <StarRating appearance="refresh" value={entryDraft.personalRating} onChange={(v) => setEntryDraft(d => ({ ...d, personalRating: v }))} size={28} />
                        <Text style={[type.caption, strong, styles.label]}>{t("detail.sessions.notes")}</Text>
                        <TextInput style={[type.body, styles.input, styles.multiline]} value={entryDraft.notes} onChangeText={v => setEntryDraft(d => ({ ...d, notes: v }))}
                          placeholder={t("detail.sessions.notesPlaceholder")} placeholderTextColor={colors.placeholder} multiline numberOfLines={3} textAlignVertical="top" accessibilityLabel={t("detail.sessions.notes")} />
                        <Text style={[type.caption, strong, styles.label]}>{t("detail.sessions.tags")}</Text>
                        <TextInput style={[type.body, styles.input]} value={entryDraft.tags} onChangeText={v => setEntryDraft(d => ({ ...d, tags: v }))}
                          placeholder={t("detail.sessions.tagsPlaceholder")} placeholderTextColor={colors.placeholder} accessibilityLabel={t("detail.sessions.tags")} />
                        <PrimaryButton title={t("detail.sessions.saveRating")} onPress={() => saveEntry(cm.matchId)} loading={savingEntry} />
                      </View>}
                    </View>}
                  </View>;
                })}
              </Card>
            </Section>)}
        </View>}

        {tab === "members" && <View style={styles.tabContent}>
          {isMember && <PrimaryButton title={t("detail.members.invite")} variant="secondary" icon={<Glyph name="account-plus-outline" size={20} color={colors.primary} />}
            onPress={() => Alert.alert(t("common.comingSoon"), t("detail.members.inviteSoon"))} />}
          <Card>
            {campaign.members.map((m, index) => <View key={m.userId} style={[styles.member, index > 0 && styles.divider]}>
              <Avatar name={m.userName} />
              <View style={styles.flex}>
                <Text style={[type.body, strong]}>{m.userName}</Text>
                <Text style={type.caption}>{[m.isCreator ? t("detail.members.creator") : null, t(getCampaignMemberStatusKey(m.status))].filter(Boolean).join(" · ")}</Text>
              </View>
              {isMember && !m.isCreator && m.userId !== currentUser?.id && <TouchableOpacity onPress={() => handleRemoveMember(m.userId, m.userName)} style={styles.iconButton}
                accessibilityRole="button" accessibilityLabel={t("ui.removeMember", { name: m.userName })}>
                <Glyph name="account-remove-outline" size={20} color={colors.danger} />
              </TouchableOpacity>}
            </View>)}
          </Card>
        </View>}

        {tab === "notes" && <View style={styles.tabContent}>
          {editingNotes ? <>
            <TextInput style={[type.body, styles.input, styles.notesInput]} value={notesDraft} onChangeText={setNotesDraft} placeholder={t("detail.notes.placeholder")}
              placeholderTextColor={colors.placeholder} multiline numberOfLines={14} textAlignVertical="top" autoFocus accessibilityLabel={t("detail.tabs.notes")} />
            <View style={styles.actions}>
              <View style={styles.flex}><PrimaryButton title={t("common.cancel")} variant="secondary" disabled={actionLoading}
                onPress={() => navigationGuard.discard(() => { setEditingNotes(false); setNotesDraft(campaign.notes ?? ""); })} /></View>
              <View style={styles.flex}><PrimaryButton title={t("common.save")} loading={actionLoading} onPress={saveNotes} /></View>
            </View>
          </> : <>
            {campaign.notes ? <Card padded><Text style={type.body}>{campaign.notes}</Text></Card>
              : <EmptyState title={t("detail.notes.emptyTitle")} message={t("detail.notes.emptyMessage")} />}
            {isMember && <PrimaryButton title={campaign.notes ? t("detail.notes.edit") : t("detail.notes.write")} variant="secondary"
              icon={<Glyph name="pencil-outline" size={18} color={colors.primary} />} onPress={() => setEditingNotes(true)} />}
          </>}
        </View>}

        {canManage && <Section title={t("detail.actions.manage")}>
          <Card>
            {isCreator && isActive && <Row first title={t("detail.actions.completeTitle")} tone="link" end="none" accessibilityLabel={t("detail.actions.completeTitle")}
              onPress={() => confirmStatus(t("detail.actions.completeTitle"), t("detail.actions.completeConfirm"), t("common.yes"), false, () => campaignService.complete(id!))} />}
            {isCreator && isActive && <Row title={t("detail.actions.abandonTitle")} tone="danger" end="none" accessibilityLabel={t("detail.actions.abandonTitle")}
              onPress={() => confirmStatus(t("detail.actions.abandonTitle"), t("detail.actions.abandonConfirm"), t("detail.actions.abandon"), true, () => campaignService.abandon(id!))} />}
            {isMember && !isCreator && <Row first title={t("detail.members.leave")} tone="danger" end="none" accessibilityLabel={t("detail.members.leave")} onPress={handleLeave} />}
          </Card>
          <Note inset>{t("detail.actions.manageHint")}</Note>
        </Section>}
      </ScrollView>
    </ScreenLayout>
  );
}
const styles = StyleSheet.create({
  scroll: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.xl },
  flex: { flex: 1, minWidth: 0 },
  hero: { flexDirection: "row", alignItems: "center", gap: space.lg },
  heroStacked: { flexDirection: "column", alignItems: "flex-start" },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm, marginTop: space.xs },
  pill: { fontSize: 12, lineHeight: 18, fontWeight: "600", paddingHorizontal: 9, paddingVertical: 1, borderRadius: 999, overflow: "hidden" },
  pending: { color: colors.pendingText, backgroundColor: colors.pendingSoft },
  tag: { color: colors.muted, backgroundColor: colors.track },
  invite: { gap: space.sm, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.pendingSoft },
  actions: { flexDirection: "row", gap: space.md },
  tabContent: { gap: space.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hair },
  matchHeader: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52, paddingHorizontal: space.lg, paddingVertical: space.md },
  matchMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm, marginTop: 2 },
  journal: { gap: space.md, padding: space.lg, paddingTop: 0 },
  entry: { flexDirection: "row", gap: space.md },
  entryBody: { gap: space.xs },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  form: { gap: space.sm, padding: space.lg, borderRadius: radius.control, backgroundColor: colors.tint },
  label: { color: colors.text, marginTop: space.xs },
  input: { minHeight: touch, borderWidth: 1, borderColor: colors.field, borderRadius: radius.control, backgroundColor: colors.card, paddingHorizontal: space.md, paddingVertical: space.sm, color: colors.text },
  multiline: { minHeight: 100 },
  notesInput: { minHeight: 280 },
  member: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 60, paddingHorizontal: space.lg, paddingVertical: space.sm },
  iconButton: { width: touch, height: touch, alignItems: "center", justifyContent: "center" },
});
