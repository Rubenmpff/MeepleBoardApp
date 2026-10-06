import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
/**
 * CampaignDetailScreen.tsx
 * src/features/games/screens/CampaignDetailScreen.tsx
 */
import { CAMPAIGN_STATUS_COLORS } from "@/src/styles/statusColors";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, RefreshControl, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import campaignService from "@/src/features/games/campaigns/services/campaignService";
import { Campaign, CampaignMatch, JournalEntry, getCampaignStatusKey, getCampaignMemberStatusKey } from "@/src/features/games/campaigns/types/Campaign";
import { StarRating } from "@/src/shared/components/StarRating";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
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
  if (loading) return <ScreenLayout title={t("ui.detailTitle")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;
  if (!campaign || loadError) return <ScreenLayout title={t("ui.detailTitle")}><ScreenState error={loadError} message={t(loadError ? "detail.loadError" : "detail.notFound")} onRetry={() => fetchCampaign()} retryLabel={t("ui.retry")} /></ScreenLayout>;
  const statusColor = CAMPAIGN_STATUS_COLORS[campaign.status];
  return (
    <ScreenLayout title={t("ui.detailTitle")} keyboard>
      <ScrollView
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchCampaign(true); }}
            colors={[COLORS.primary]} />
        }
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {campaign.gameImageUrl ? (
            <Image source={{ uri: campaign.gameImageUrl }} style={styles.heroBg} blurRadius={8} />
          ) : (
            <View style={[styles.heroBg, { backgroundColor: COLORS.primary + "20" }]} />
          )}
          <View style={styles.heroOverlay} />
          <View style={[styles.heroContent, compact && { flexDirection: "column", alignItems: "flex-start" }]}>
            {campaign.gameImageUrl && (
              <Image source={{ uri: campaign.gameImageUrl }} style={styles.heroGameImage} />
            )}
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{campaign.name}</Text>
              {campaign.gameName && (
                <Text style={styles.heroGame}>🎲 {campaign.gameName}</Text>
              )}
              <View style={styles.heroMeta}>
                <View style={[styles.statusPill, { backgroundColor: statusColor + "30" }]}>
                  <Text style={[styles.statusText, { color: "#fff" }]}>
                    {t(getCampaignStatusKey(campaign.status))}
                  </Text>
                </View>
                <Text style={styles.heroMetaText}>👥 {campaign.memberCount}</Text>
                <Text style={styles.heroMetaText}>🎲 {campaign.matchCount}</Text>
                {campaign.averagePersonalRating != null && (
                  <Text style={styles.heroMetaText}>⭐ {campaign.averagePersonalRating.toFixed(1)}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
        {/* ── Convite pendente ── */}
        {isPending && (
          <View style={styles.inviteCard}>
            <MaterialIcons name="mail" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteTitle}>{t("detail.invite.title")}</Text>
              <Text style={styles.inviteSub}>{t("detail.invite.message")}</Text>
            </View>
            <View style={styles.inviteActions}>
              <TouchableOpacity style={styles.inviteBtnAccept} onPress={() => handleRespondInvite(true)} disabled={actionLoading} accessibilityRole="button" accessibilityLabel={t("detail.invite.accept")}>
                <Text style={styles.inviteBtnText}>✅ {t("detail.invite.accept")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inviteBtnDecline} onPress={() => handleRespondInvite(false)} disabled={actionLoading} accessibilityRole="button" accessibilityLabel={t("detail.invite.decline")}>
                <Text style={styles.inviteBtnText}>❌ {t("detail.invite.decline")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* ── Ações do criador ── */}
        {isCreator && isActive && (
          <View style={styles.actionsBar}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
              onPress={() => Alert.alert(t("detail.actions.completeTitle"), t("detail.actions.completeConfirm"), [
                { text: t("common.no"), style: "cancel" },
                { text: t("common.yes"), onPress: async () => { await campaignService.complete(id!); fetchCampaign(true); } }
              ])} accessibilityRole="button">
              <MaterialIcons name="check-circle" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>{t("detail.actions.complete")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.error }]}
              onPress={() => Alert.alert(t("detail.actions.abandonTitle"), t("detail.actions.abandonConfirm"), [
                { text: t("common.no"), style: "cancel" },
                { text: t("detail.actions.abandon"), style: "destructive", onPress: async () => { await campaignService.abandon(id!); fetchCampaign(true); } }
              ])} accessibilityRole="button">
              <MaterialIcons name="cancel" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>{t("detail.actions.abandon")}</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          {([
            { key: "matches", label: t("detail.tabs.sessions", { count: daySessions.length }) },
            { key: "members", label: t("detail.tabs.members", { count: campaign.memberCount }) },
            { key: "notes",   label: t("detail.tabs.notes") },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.8} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: tab === key }}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* ════════════════════════════
            TAB — Sessões
        ════════════════════════════ */}
        {tab === "matches" && (
          <View style={styles.tabContent}>
            {isMember && (
              <TouchableOpacity
                style={styles.newEncounterBtn}
                onPress={() => router.push({
                  pathname: "/(app)/games/campaigns/encounter/create" as any,
                  params: {
                    campaignId: campaign.id,
                    gameId: campaign.gameId,
                    gameName: campaign.gameName ?? "",
                    memberNames: campaign.members
                      .filter(m => m.status === "Accepted")
                      .map(m => m.userName)
                      .join(","),
                    memberIds: campaign.members
                      .filter(m => m.status === "Accepted")
                      .map(m => m.userId)
                      .join(","),
                  }
                })}
                activeOpacity={0.85} accessibilityRole="button"
              >
                <MaterialIcons name="add-circle" size={20} color="#fff" />
                <Text style={styles.newEncounterBtnText}>{t("detail.sessions.newEncounter")}</Text>
              </TouchableOpacity>
            )}
            {daySessions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="history" size={40} color="#ddd" />
                <Text style={styles.emptyTitle}>{t("detail.sessions.emptyTitle")}</Text>
                <Text style={styles.emptyText}>{t("detail.sessions.emptyMessage")}</Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {daySessions.map((session, sIdx) => (
                  <View key={session.dateKey} style={[styles.timelineRow, compact && { flexDirection: "column" }]}>
                    <View style={[styles.timelineCol, compact && { width: "100%", alignItems: "flex-start", marginBottom: 8 }]}>
                      <View style={styles.timelineDot}>
                        <Text style={styles.timelineDotText}>{session.sessionNumber}</Text>
                      </View>
                      {!compact && sIdx < daySessions.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={[styles.timelineContent, compact && { marginLeft: 0 }]}>
                      <Text style={styles.sessionTitle}>{t("detail.sessions.session", { number: session.sessionNumber })}</Text>
                      <Text style={styles.sessionDate}>
                        {new Date(session.dateKey + "T00:00:00").toLocaleDateString(locale, {
                          weekday: "long", day: "numeric", month: "long",
                        })}
                      </Text>
                      {session.matches.map((cm: CampaignMatch) => {
                        const isExp = expandedMatch === cm.matchId;
                        const entries = journalEntries[cm.matchId] ?? [];
                        const myEntry = entries.find(e => e.userId === currentUser?.id);
                        return (
                          <View key={cm.id} style={styles.matchCard}>
                            <TouchableOpacity style={styles.matchCardHeader} disabled={cm.canReadJournal !== true} onPress={() => entryDirty ? navigationGuard.discard(() => { void toggleMatch(cm.matchId); }) : void toggleMatch(cm.matchId)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={cm.sessionTitle || cm.gameName || t("detail.sessions.encounter")} accessibilityState={{ expanded: isExp, disabled: cm.canReadJournal !== true }}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.matchTitle}>{cm.sessionTitle || cm.gameName || t("detail.sessions.encounter")}</Text>
                                <View style={styles.matchMetaRow}>
                                  {cm.durationInMinutes && (
                                    <Text style={styles.matchMetaText}>⏱ {cm.durationInMinutes}min</Text>
                                  )}
                                  <Text style={styles.matchMetaText}>
                                    💬 {t("detail.sessions.ratings", { count: entries.length })}
                                  </Text>
                                  {!myEntry && isMember && cm.canReadJournal === true && (
                                    <View style={styles.pendingBadge}>
                                      <Text style={styles.pendingBadgeText}>{t("detail.sessions.evaluate")}</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                              {cm.canReadJournal === true ? <MaterialIcons name={isExp ? "expand-less" : "expand-more"} size={22} color={COLORS.textMuted} /> : <Text style={styles.matchMetaText}>{t("detail.sessions.participantsOnly")}</Text>}
                            </TouchableOpacity>
                            {isExp && cm.canReadJournal === true && (
                              <View style={styles.journalWrap}>
                                {/* Entradas existentes */}
                                {entries.map((entry: JournalEntry) => (
                                  <View key={entry.id} style={styles.entryRow}>
                                    <View style={styles.entryAvatar}>
                                      <Text style={styles.entryAvatarText}>{entry.userName[0]?.toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <View style={styles.entryHeader}>
                                        <Text style={styles.entryName}>{entry.userName}</Text>
                                        {entry.personalRating != null && (
                                          <StarRating appearance="refresh" value={entry.personalRating} readonly size={14} showLabel={false} />
                                        )}
                                      </View>
                                      {entry.userId === currentUser?.id && entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
                                      {entry.tags && (
                                        <View style={styles.tagsRow}>
                                          {entry.tags.split(",").map((tag, i) => (
                                            <View key={i} style={styles.tagChip}>
                                              <Text style={styles.tagText}>#{tag.trim()}</Text>
                                            </View>
                                          ))}
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                ))}
                                {/* Formulário da minha avaliação */}
                                {isMember && (
                                  <View style={styles.myEntryForm}>
                                    <Text style={styles.myEntryTitle}>
                                      {myEntry ? `✏️ ${t("detail.sessions.editRating")}` : `⭐ ${t("detail.sessions.yourRating")}`}
                                    </Text>
                                    <Text style={styles.myEntryLabel}>{t("detail.sessions.rating")}</Text>
                                    <StarRating appearance="refresh"
                                      value={entryDraft.personalRating}
                                      onChange={(v) => setEntryDraft(d => ({ ...d, personalRating: v }))}
                                      size={28}
                                    />
                                    <Text style={[styles.myEntryLabel, { marginTop: 14 }]}>{t("detail.sessions.notes")}</Text>
                                    <TextInput
                                      style={styles.myEntryInput}
                                      value={entryDraft.notes}
                                      onChangeText={v => setEntryDraft(d => ({ ...d, notes: v }))}
                                      placeholder={t("detail.sessions.notesPlaceholder")}
                                      placeholderTextColor={COLORS.textMuted}
                                      multiline numberOfLines={3}
                                      textAlignVertical="top" accessibilityLabel={t("detail.sessions.notes")}
                                    />
                                    <Text style={[styles.myEntryLabel, { marginTop: 10 }]}>{t("detail.sessions.tags")}</Text>
                                    <TextInput
                                      style={styles.myEntryInputSingle}
                                      value={entryDraft.tags}
                                      onChangeText={v => setEntryDraft(d => ({ ...d, tags: v }))}
                                      placeholder={t("detail.sessions.tagsPlaceholder")}
                                      placeholderTextColor={COLORS.textMuted} accessibilityLabel={t("detail.sessions.tags")}
                                    />
                                    <View style={{ marginTop: 16 }}><PrimaryButton title={t("detail.sessions.saveRating")} onPress={() => saveEntry(cm.matchId)} loading={savingEntry} /></View>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {/* ════════════════════════════
            TAB — Membros
        ════════════════════════════ */}
        {tab === "members" && (
          <View style={styles.tabContent}>
            {isMember && (
              <TouchableOpacity
                style={styles.inviteMemberBtn}
                onPress={() => Alert.alert(t("common.comingSoon"), t("detail.members.inviteSoon"))} accessibilityRole="button"
              >
                <MaterialIcons name="person-add" size={18} color="#fff" />
                <Text style={styles.inviteMemberBtnText}>{t("detail.members.invite")}</Text>
              </TouchableOpacity>
            )}
            {campaign.members.map(m => (
              <View key={m.userId} style={styles.memberRow}>
                <View style={[styles.memberAvatar, m.isCreator && { backgroundColor: "#FFF8E1" }]}>
                  <Text style={[styles.memberAvatarText, m.isCreator && { color: COLORS.secondary }]}>
                    {m.userName[0]?.toUpperCase()}
                  </Text>
                  {m.isCreator && (
                    <View style={styles.crownBadge}>
                      <Text style={{ fontSize: 8 }}>👑</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.userName}</Text>
                  <Text style={styles.memberStatus}>{t(getCampaignMemberStatusKey(m.status))}</Text>
                </View>
                {isMember && !m.isCreator && m.userId !== currentUser?.id && (
                  <TouchableOpacity onPress={() => handleRemoveMember(m.userId, m.userName)} style={styles.removeMemberBtn} accessibilityRole="button" accessibilityLabel={t("ui.removeMember", { name: m.userName })}>
                    <MaterialIcons name="close" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {isMember && !isCreator && (
              <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} accessibilityRole="button">
                <MaterialIcons name="exit-to-app" size={16} color={COLORS.error} />
                <Text style={styles.leaveBtnText}>{t("detail.members.leave")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* ════════════════════════════
            TAB — Notas
        ════════════════════════════ */}
        {tab === "notes" && (
          <View style={styles.tabContent}>
            {editingNotes ? (
              <View>
                <TextInput
                  style={styles.notesInput}
                  value={notesDraft}
                  onChangeText={setNotesDraft}
                  placeholder={t("detail.notes.placeholder")}
                  placeholderTextColor={COLORS.textMuted}
                  multiline numberOfLines={14}
                  textAlignVertical="top"
                  autoFocus accessibilityLabel={t("detail.tabs.notes")}
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity style={styles.notesCancelBtn}
                    onPress={() => navigationGuard.discard(() => { setEditingNotes(false); setNotesDraft(campaign.notes ?? ""); })} accessibilityRole="button">
                    <Text style={styles.notesCancelText}>{t("common.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.notesSaveBtn, actionLoading && { opacity: 0.5 }]}
                    onPress={saveNotes} disabled={actionLoading} accessibilityRole="button">
                    {actionLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.notesSaveText}>{t("common.save")}</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {campaign.notes ? (
                  <Text style={styles.notesText}>{campaign.notes}</Text>
                ) : (
                  <View style={styles.emptyWrap}>
                    <MaterialIcons name="notes" size={40} color="#ddd" />
                    <Text style={styles.emptyTitle}>{t("detail.notes.emptyTitle")}</Text>
                    <Text style={styles.emptyText}>{t("detail.notes.emptyMessage")}</Text>
                  </View>
                )}
                {isMember && (
                  <TouchableOpacity style={styles.editNotesBtn} onPress={() => setEditingNotes(true)} accessibilityRole="button">
                    <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                    <Text style={styles.editNotesBtnText}>
                      {campaign.notes ? t("detail.notes.edit") : t("detail.notes.write")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
}
const styles = StyleSheet.create({
  // Hero
  hero: { minHeight: 180, margin: 16, borderRadius: 20, position: "relative", overflow: "hidden" },
  heroBg: { position: "absolute", width: "100%", height: "100%" },
  heroOverlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.55)" },
  heroContent: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  heroGameImage: { width: 70, height: 70, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  heroText: { flex: 1 },
  heroTitle: { ...UI_STYLES.title, color: "#fff", marginBottom: 8 },
  heroGame: { ...UI_STYLES.body, color: "#fff", marginBottom: 12 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroMetaText: { ...UI_STYLES.caption, color: "#fff" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusText: { ...UI_STYLES.caption, fontWeight: "700" },
  // Convite
  inviteCard: {
    margin: 16, backgroundColor: COLORS.primary + "08",
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.primary + "30",
    gap: 10,
  },
  inviteTitle: { fontSize: 14, fontWeight: "700", color: COLORS.onBackground },
  inviteSub: { ...UI_STYLES.caption, color: COLORS.inactive, marginTop: 2 },
  inviteActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%" },
  inviteBtnAccept: { ...UI_STYLES.button, flex: 1, minWidth: 100, backgroundColor: COLORS.success },
  inviteBtnDecline: { ...UI_STYLES.button, flex: 1, minWidth: 100, backgroundColor: COLORS.error },
  inviteBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  // Actions bar
  actionsBar: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  actionBtn: { ...UI_STYLES.button, flex: 1, minWidth: 110, flexDirection: "row", gap: 8 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  // Tabs
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  tabBtn: { ...UI_STYLES.control, flexGrow: 1, flexBasis: "40%", padding: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  tabBtnActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  tabText: { ...UI_STYLES.caption, color: COLORS.textMuted, fontWeight: "700", textAlign: "center" },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },
  tabContent: { padding: 16 },
  // New encounter button
  newEncounterBtn: { ...UI_STYLES.button, flexDirection: "row", gap: 8, backgroundColor: COLORS.primary, marginBottom: 20 },
  newEncounterBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  // Timeline
  timeline: {},
  timelineRow: { flexDirection: "row", marginBottom: 4 },
  timelineCol: { width: 36, alignItems: "center" },
  timelineDot: {
    minWidth: 32, minHeight: 32, borderRadius: 16, padding: 4,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  timelineDotText: { color: "#fff", ...UI_STYLES.caption, fontWeight: "800" },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.primary + "25", marginVertical: 4 },
  timelineContent: { flex: 1, marginLeft: 12, paddingBottom: 24 },
  sessionTitle: { ...UI_STYLES.section, paddingTop: 4 },
  sessionDate: { ...UI_STYLES.caption, color: COLORS.textMuted, marginBottom: 12 },
  matchCard: { ...UI_STYLES.card, marginBottom: 12 },
  matchCardHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  matchTitle: { ...UI_STYLES.section },
  matchMetaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 },
  matchMetaText: { ...UI_STYLES.caption, color: COLORS.textMuted },
  pendingBadge: { backgroundColor: "#FFF3E0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pendingBadgeText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.secondary },
  // Journal
  journalWrap: { borderTopWidth: 1, borderTopColor: "#f5f5f5", padding: 14, backgroundColor: "#FAFAFA" },
  entryRow: { flexDirection: "row", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  entryAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center" },
  entryAvatarText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  entryHeader: { gap: 8, marginBottom: 8 },
  entryName: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700" },
  entryNotes: { ...UI_STYLES.body, color: COLORS.textMuted, marginBottom: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tagChip: { backgroundColor: "#f0f0f0", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText: { ...UI_STYLES.caption, color: COLORS.textMuted },
  // My entry form
  myEntryForm: {
    marginTop: 8, padding: 14, backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + "20",
  },
  myEntryTitle: { fontSize: 14, fontWeight: "800", color: COLORS.primary, marginBottom: 12 },
  myEntryLabel: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", marginBottom: 8 },
  myEntryInput: { ...UI_STYLES.field, minHeight: 100, textAlignVertical: "top" },
  myEntryInputSingle: { ...UI_STYLES.field },
  // Members
  inviteMemberBtn: { ...UI_STYLES.button, flexDirection: "row", gap: 8, backgroundColor: COLORS.primary, marginBottom: 16 },
  inviteMemberBtnText: { color: "#fff", fontWeight: "700" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#f5f5f5" },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center", position: "relative" },
  memberAvatarText: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  crownBadge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  memberName: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700" },
  memberStatus: { ...UI_STYLES.caption, color: COLORS.textMuted },
  removeMemberBtn: { ...UI_STYLES.iconButton },
  leaveBtn: { ...UI_STYLES.button, flexDirection: "row", gap: 8, borderWidth: 1, borderColor: COLORS.error, marginTop: 16 },
  leaveBtnText: { color: COLORS.error, fontWeight: "600" },
  // Notes
  notesText: { ...UI_STYLES.body, color: COLORS.onBackground },
  notesInput: { ...UI_STYLES.field, minHeight: 280, textAlignVertical: "top" },
  notesActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  notesCancelBtn: { ...UI_STYLES.button, flex: 1, minWidth: 100, backgroundColor: COLORS.primarySoft },
  notesCancelText: { color: COLORS.textMuted, fontWeight: "600" },
  notesSaveBtn: { ...UI_STYLES.button, flex: 1, minWidth: 100, backgroundColor: COLORS.primary },
  notesSaveText: { color: "#fff", fontWeight: "700" },
  editNotesBtn: { ...UI_STYLES.button, flexDirection: "row", gap: 8, backgroundColor: COLORS.primarySoft, marginTop: 16 },
  editNotesBtnText: { color: COLORS.primary, fontWeight: "600" },
  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { ...UI_STYLES.section, textAlign: "center" },
  emptyText: { ...UI_STYLES.empty },
});
