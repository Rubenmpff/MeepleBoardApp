/**
 * CampaignDetailScreen.tsx
 * src/features/games/screens/CampaignDetailScreen.tsx
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ActivityIndicator, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, RefreshControl, Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import campaignService from "@/src/features/games/services/campaignService";
import {
  Campaign, CampaignMatch, JournalEntry,
  getStatusLabel, getStatusColor, getMemberStatusLabel,
} from "@/src/features/games/types/Campaign";
import { StarRating } from "@/src/features/games/components/StarRating";
import { COLORS } from "@/src/constants/colors";
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

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("matches");
  const [actionLoading, setActionLoading] = useState(false);
  const [journalEntries, setJournalEntries] = useState<Record<string, JournalEntry[]>>({});
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [entryDraft, setEntryDraft] = useState<EntryDraft>({ notes: "", tags: "" });
  const [savingEntry, setSavingEntry] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  const fetchCampaign = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      const data = await campaignService.getById(id);
      setCampaign(data);
      setNotesDraft(data.notes ?? "");
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a campanha.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

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
      setEntryDraft(mine
        ? { personalRating: mine.personalRating ?? undefined, notes: mine.notes ?? "", tags: mine.tags ?? "" }
        : { notes: "", tags: "" });
    } catch { console.error("Erro ao carregar diário"); }
  };

  const toggleMatch = async (matchId: string) => {
    if (expandedMatch === matchId) { setExpandedMatch(null); return; }
    setExpandedMatch(matchId);
    if (!journalEntries[matchId]) await loadJournal(matchId);
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
      Alert.alert("✅ Guardado!", "A tua perspetiva foi guardada.");
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível guardar.");
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
      Alert.alert("Erro", err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    setActionLoading(true);
    try {
      await campaignService.respondInvite(id!, accept);
      await fetchCampaign(true);
    } catch (err: any) { Alert.alert("Erro", err?.message); }
    finally { setActionLoading(false); }
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    Alert.alert("Remover membro", `Remover ${userName}?`, [
      { text: "Não", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: async () => {
        try { await campaignService.removeMember(id!, userId); await fetchCampaign(true); }
        catch (err: any) { Alert.alert("Erro", err?.message); }
      }},
    ]);
  };

  const handleLeave = () => {
    Alert.alert("Sair da campanha", "Tens a certeza?", [
      { text: "Não", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
        try { await campaignService.leave(id!); router.back(); }
        catch (err: any) { Alert.alert("Erro", err?.message); }
      }},
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!campaign) return <View style={styles.center}><Text style={styles.errorText}>Campanha não encontrada.</Text></View>;

  const statusColor = getStatusColor(campaign.status);

  return (
    <View style={styles.screen}>
      <ScrollView
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
          <View style={styles.heroContent}>
            {campaign.gameImageUrl && (
              <Image source={{ uri: campaign.gameImageUrl }} style={styles.heroGameImage} />
            )}
            <View style={styles.heroText}>
              <Text style={styles.heroTitle} numberOfLines={2}>{campaign.name}</Text>
              {campaign.gameName && (
                <Text style={styles.heroGame}>🎲 {campaign.gameName}</Text>
              )}
              <View style={styles.heroMeta}>
                <View style={[styles.statusPill, { backgroundColor: statusColor + "30" }]}>
                  <Text style={[styles.statusText, { color: "#fff" }]}>
                    {getStatusLabel(campaign.status)}
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
              <Text style={styles.inviteTitle}>Foste convidado para esta campanha!</Text>
              <Text style={styles.inviteSub}>Aceita para participar nas aventuras do grupo.</Text>
            </View>
            <View style={styles.inviteActions}>
              <TouchableOpacity style={styles.inviteBtnAccept} onPress={() => handleRespondInvite(true)} disabled={actionLoading}>
                <Text style={styles.inviteBtnText}>✅ Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inviteBtnDecline} onPress={() => handleRespondInvite(false)} disabled={actionLoading}>
                <Text style={styles.inviteBtnText}>❌ Recusar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Ações do criador ── */}
        {isCreator && isActive && (
          <View style={styles.actionsBar}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
              onPress={() => Alert.alert("Concluir", "Tens a certeza?", [
                { text: "Não", style: "cancel" },
                { text: "Sim", onPress: async () => { await campaignService.complete(id!); fetchCampaign(true); } }
              ])}>
              <MaterialIcons name="check-circle" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Concluir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.error }]}
              onPress={() => Alert.alert("Abandonar", "Esta ação não pode ser desfeita.", [
                { text: "Não", style: "cancel" },
                { text: "Abandonar", style: "destructive", onPress: async () => { await campaignService.abandon(id!); fetchCampaign(true); } }
              ])}>
              <MaterialIcons name="cancel" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Abandonar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          {([
            { key: "matches", label: `Sessões (${daySessions.length})` },
            { key: "members", label: `Membros (${campaign.memberCount})` },
            { key: "notes",   label: "Notas" },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.8}
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
                activeOpacity={0.85}
              >
                <MaterialIcons name="add-circle" size={20} color="#fff" />
                <Text style={styles.newEncounterBtnText}>Novo Encontro</Text>
              </TouchableOpacity>
            )}

            {daySessions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="history" size={40} color="#ddd" />
                <Text style={styles.emptyTitle}>Sem sessões ainda</Text>
                <Text style={styles.emptyText}>Regista o primeiro encontro da campanha!</Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {daySessions.map((session, sIdx) => (
                  <View key={session.dateKey} style={styles.timelineRow}>
                    <View style={styles.timelineCol}>
                      <View style={styles.timelineDot}>
                        <Text style={styles.timelineDotText}>{session.sessionNumber}</Text>
                      </View>
                      {sIdx < daySessions.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.sessionTitle}>Sessão {session.sessionNumber}</Text>
                      <Text style={styles.sessionDate}>
                        {new Date(session.dateKey + "T00:00:00").toLocaleDateString("pt-PT", {
                          weekday: "long", day: "numeric", month: "long",
                        })}
                      </Text>
                      {session.matches.map((cm: CampaignMatch) => {
                        const isExp = expandedMatch === cm.matchId;
                        const entries = journalEntries[cm.matchId] ?? [];
                        const myEntry = entries.find(e => e.userId === currentUser?.id);
                        return (
                          <View key={cm.id} style={styles.matchCard}>
                            <TouchableOpacity style={styles.matchCardHeader} onPress={() => toggleMatch(cm.matchId)} activeOpacity={0.8}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.matchTitle}>{cm.sessionTitle || cm.gameName || "Encontro"}</Text>
                                <View style={styles.matchMetaRow}>
                                  {cm.durationInMinutes && (
                                    <Text style={styles.matchMetaText}>⏱ {cm.durationInMinutes}min</Text>
                                  )}
                                  <Text style={styles.matchMetaText}>
                                    💬 {entries.length} avaliação{entries.length !== 1 ? "ões" : ""}
                                  </Text>
                                  {!myEntry && isMember && (
                                    <View style={styles.pendingBadge}>
                                      <Text style={styles.pendingBadgeText}>Avaliar</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                              <MaterialIcons name={isExp ? "expand-less" : "expand-more"} size={22} color="#bbb" />
                            </TouchableOpacity>

                            {isExp && (
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
                                          <StarRating value={entry.personalRating} readonly size={14} showLabel={false} />
                                        )}
                                      </View>
                                      {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
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
                                      {myEntry ? "✏️ Editar avaliação" : "⭐ A tua avaliação"}
                                    </Text>

                                    <Text style={styles.myEntryLabel}>Rating</Text>
                                    <StarRating
                                      value={entryDraft.personalRating}
                                      onChange={(v) => setEntryDraft(d => ({ ...d, personalRating: v }))}
                                      size={28}
                                    />

                                    <Text style={[styles.myEntryLabel, { marginTop: 14 }]}>Notas</Text>
                                    <TextInput
                                      style={styles.myEntryInput}
                                      value={entryDraft.notes}
                                      onChangeText={v => setEntryDraft(d => ({ ...d, notes: v }))}
                                      placeholder="O que achaste desta sessão?"
                                      placeholderTextColor="#bbb"
                                      multiline numberOfLines={3}
                                      textAlignVertical="top"
                                    />

                                    <Text style={[styles.myEntryLabel, { marginTop: 10 }]}>Tags</Text>
                                    <TextInput
                                      style={styles.myEntryInputSingle}
                                      value={entryDraft.tags}
                                      onChangeText={v => setEntryDraft(d => ({ ...d, tags: v }))}
                                      placeholder="épico, reviravolta, difícil..."
                                      placeholderTextColor="#bbb"
                                    />

                                    <TouchableOpacity
                                      style={[styles.saveEntryBtn, savingEntry && { opacity: 0.5 }]}
                                      onPress={() => saveEntry(cm.matchId)}
                                      disabled={savingEntry}
                                    >
                                      {savingEntry
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.saveEntryBtnText}>Guardar avaliação</Text>
                                      }
                                    </TouchableOpacity>
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
                onPress={() => Alert.alert("Em breve", "Convite de membros disponível em breve!")}
              >
                <MaterialIcons name="person-add" size={18} color="#fff" />
                <Text style={styles.inviteMemberBtnText}>Convidar membro</Text>
              </TouchableOpacity>
            )}

            {campaign.members.map(m => (
              <View key={m.userId} style={styles.memberRow}>
                <View style={[styles.memberAvatar, m.isCreator && { backgroundColor: "#FFF8E1" }]}>
                  <Text style={[styles.memberAvatarText, m.isCreator && { color: "#F9A825" }]}>
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
                  <Text style={styles.memberStatus}>{getMemberStatusLabel(m.status)}</Text>
                </View>
                {isMember && !m.isCreator && m.userId !== currentUser?.id && (
                  <TouchableOpacity onPress={() => handleRemoveMember(m.userId, m.userName)} style={styles.removeMemberBtn}>
                    <MaterialIcons name="close" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {isMember && !isCreator && (
              <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
                <MaterialIcons name="exit-to-app" size={16} color={COLORS.error} />
                <Text style={styles.leaveBtnText}>Sair da campanha</Text>
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
                  placeholder="Estado do mundo, personagens, objetivos, segredos..."
                  placeholderTextColor="#bbb"
                  multiline numberOfLines={14}
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity style={styles.notesCancelBtn}
                    onPress={() => { setEditingNotes(false); setNotesDraft(campaign.notes ?? ""); }}>
                    <Text style={styles.notesCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.notesSaveBtn, actionLoading && { opacity: 0.5 }]}
                    onPress={saveNotes} disabled={actionLoading}>
                    {actionLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.notesSaveText}>Guardar</Text>
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
                    <Text style={styles.emptyTitle}>Sem notas ainda</Text>
                    <Text style={styles.emptyText}>Qualquer membro pode escrever aqui!</Text>
                  </View>
                )}
                {isMember && (
                  <TouchableOpacity style={styles.editNotesBtn} onPress={() => setEditingNotes(true)}>
                    <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                    <Text style={styles.editNotesBtnText}>
                      {campaign.notes ? "Editar notas" : "Escrever notas"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: COLORS.error, fontSize: 16 },

  // Hero
  hero: { height: 200, position: "relative", overflow: "hidden" },
  heroBg: { position: "absolute", width: "100%", height: "100%" },
  heroOverlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.55)" },
  heroContent: { flex: 1, flexDirection: "row", alignItems: "flex-end", padding: 16, gap: 12 },
  heroGameImage: { width: 70, height: 70, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 4 },
  heroGame: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroMetaText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Convite
  inviteCard: {
    margin: 16, backgroundColor: COLORS.primary + "08",
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.primary + "30",
    gap: 10,
  },
  inviteTitle: { fontSize: 14, fontWeight: "700", color: COLORS.onBackground },
  inviteSub: { fontSize: 12, color: COLORS.inactive, marginTop: 2 },
  inviteActions: { flexDirection: "row", gap: 8 },
  inviteBtnAccept: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  inviteBtnDecline: { flex: 1, backgroundColor: COLORS.error, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  inviteBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Actions bar
  actionsBar: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Tabs
  tabsRow: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: COLORS.inactive },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },
  tabContent: { padding: 16 },

  // New encounter button
  newEncounterBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 14, marginBottom: 20,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  newEncounterBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // Timeline
  timeline: {},
  timelineRow: { flexDirection: "row", marginBottom: 4 },
  timelineCol: { width: 36, alignItems: "center" },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  timelineDotText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.primary + "25", marginVertical: 4 },
  timelineContent: { flex: 1, marginLeft: 12, paddingBottom: 24 },
  sessionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground, paddingTop: 4 },
  sessionDate: { fontSize: 12, color: COLORS.inactive, marginBottom: 12, textTransform: "capitalize" },

  matchCard: {
    backgroundColor: "#fff", borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#f0f0f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    overflow: "hidden",
  },
  matchCardHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  matchTitle: { fontSize: 14, fontWeight: "700", color: COLORS.onBackground },
  matchMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  matchMetaText: { fontSize: 11, color: COLORS.inactive },
  pendingBadge: { backgroundColor: "#FFF3E0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pendingBadgeText: { fontSize: 10, fontWeight: "700", color: "#E65100" },

  // Journal
  journalWrap: { borderTopWidth: 1, borderTopColor: "#f5f5f5", padding: 14, backgroundColor: "#FAFAFA" },
  entryRow: { flexDirection: "row", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  entryAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center" },
  entryAvatarText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  entryName: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground },
  entryNotes: { fontSize: 13, color: "#555", lineHeight: 18, marginBottom: 6 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tagChip: { backgroundColor: "#f0f0f0", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 10, color: "#666" },

  // My entry form
  myEntryForm: {
    marginTop: 8, padding: 14, backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + "20",
  },
  myEntryTitle: { fontSize: 14, fontWeight: "800", color: COLORS.primary, marginBottom: 12 },
  myEntryLabel: { fontSize: 12, fontWeight: "700", color: COLORS.inactive, marginBottom: 8 },
  myEntryInput: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 10,
    padding: 10, fontSize: 13, height: 80,
    backgroundColor: "#fafafa", color: COLORS.onBackground,
  },
  myEntryInputSingle: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 10,
    padding: 10, fontSize: 13, backgroundColor: "#fafafa", color: COLORS.onBackground,
  },
  saveEntryBtn: { marginTop: 14, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  saveEntryBtnText: { color: "#fff", fontWeight: "700" },

  // Members
  inviteMemberBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, marginBottom: 16,
  },
  inviteMemberBtnText: { color: "#fff", fontWeight: "700" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#f5f5f5" },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center", position: "relative" },
  memberAvatarText: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  crownBadge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  memberName: { fontSize: 14, fontWeight: "600", color: COLORS.onBackground },
  memberStatus: { fontSize: 12, color: COLORS.inactive, marginTop: 2 },
  removeMemberBtn: { padding: 8 },
  leaveBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14, marginTop: 8 },
  leaveBtnText: { color: COLORS.error, fontWeight: "600" },

  // Notes
  notesText: { fontSize: 15, lineHeight: 26, color: COLORS.onBackground },
  notesInput: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 12,
    padding: 14, fontSize: 15, minHeight: 220,
    backgroundColor: "#fff", color: COLORS.onBackground,
  },
  notesActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  notesCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  notesCancelText: { color: "#666", fontWeight: "600" },
  notesSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: "center" },
  notesSaveText: { color: "#fff", fontWeight: "700" },
  editNotesBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, paddingVertical: 8 },
  editNotesBtnText: { color: COLORS.primary, fontWeight: "600" },

  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#ccc" },
  emptyText: { fontSize: 13, color: COLORS.inactive, textAlign: "center" },
});