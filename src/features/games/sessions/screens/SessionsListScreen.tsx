/**
 * SessionsListScreen.tsx
 *
 * Lista de sessões com 4 tabs:
 *   - Ativas    → sessões em curso
 *   - Agendadas → sessões futuras
 *   - Encerradas → sessões fechadas
 *   - Convites  → sessões onde fui convidado e ainda não respondi
 * Pesquisa por nome ou local e filtro «Jogo previsto» (inclui «Por definir»); as contagens seguem-nos.
 * Separador, pesquisa e filtro ficam guardados por conta enquanto a app está aberta.
 */
import { SESSION_STATUS_COLORS } from "@/src/styles/statusColors";
import { useTranslation } from "react-i18next";
import ScreenLayout, { EmbeddedScreen } from "@/src/components/ui/ScreenLayout";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { FilterChips, SearchField, Glyph } from "@/src/ui/components";
import { ActiveFilters, FilterSheet, ListToolbar, NoResults, OptionGroup } from "@/src/ui/Filters";
import { recall, useAccountId, useRemember } from "@/src/shared/hooks/useAccountMemory";
import { formatDateTime } from "@/src/ui/format";
import ScreenState from "@/src/components/ui/ScreenState";
import { useCallback, useContext, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import sessionService from "@/src/features/games/sessions/services/sessionService";
import { GameSession } from "@/src/features/games/sessions/types/GameSession";
import { sessionPlayerGuards } from "@/src/features/games/sessions/types/GameSessionPlayer";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import SessionAttendance from "../components/SessionAttendance";
import { GameThumb } from "../components/PlannedGame";
import { RootState } from "@/src/store/store";
type TabKey = "Active" | "Upcoming" | "Closed" | "Invites";
// Invitations first: they are the ones waiting for an answer.
const TABS: TabKey[] = ["Invites", "Active", "Upcoming", "Closed"];
export default function SessionsListScreen() {
  const { t, i18n } = useTranslation("matches");
  const embedded = useContext(EmbeddedScreen);
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const account = useAccountId();
  const [tab, setTab] = useState<TabKey>(() => recall<TabKey>(account, "sessions:tab", "Active"));
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState(() => recall(account, "sessions:search", ""));
  // Planned game id, "none" for «Por definir», or undefined for any.
  const [planned, setPlanned] = useState<string | undefined>(() => recall<string | undefined>(account, "sessions:planned", undefined));
  const [filtersVisible, setFiltersVisible] = useState(false);
  useRemember("sessions:tab", tab);
  useRemember("sessions:search", search);
  useRemember("sessions:planned", planned);
  const load = useCallback(async () => {
    try {
      setLoadError(false);
      setLoading(true);
      const data = await sessionService.getMine();
      setSessions(data ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  /* ── Filtering ── */
  // Search and planned game first, over every session; tab counts follow them.
  const narrowed = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return (sessions ?? []).filter(s => (!q || [s.name, s.location, s.plannedGameName].some(v => v?.toLocaleLowerCase().includes(q)))
      && (planned === undefined || (planned === "none" ? !s.plannedGameId : s.plannedGameId === planned)));
  }, [sessions, search, planned]);
  const plannedOptions = useMemo(() => {
    const games = new Map<string, string>();
    for (const s of sessions ?? []) if (s.plannedGameId) games.set(s.plannedGameId, s.plannedGameName ?? "");
    return [...[...games].sort((a, b) => a[1].localeCompare(b[1])).map(([key, label]) => ({ key, label })), { key: "none", label: t("sessions.plannedUndecided") }];
  }, [sessions, t]);
  const plannedLabel = planned === undefined ? undefined : plannedOptions.find(o => o.key === planned)?.label ?? t("sessions.list.plannedFilter");
  const filtered = useMemo(() => {
    const sessions = narrowed;
    if (!sessions) return [];
    if (tab === "Invites") {
      // Sessões onde fui convidado (não sou organizer) e ainda não respondi (Pending)
      return sessions.filter((s) => {
        if (s.status === "Cancelled") return false;
        if (s.organizerId === currentUser?.id) return false;
        const myLink = s.players?.find((p) => p.userId === currentUser?.id);
        return myLink && sessionPlayerGuards.isPending(myLink);
      });
    }
    return sessions.filter((s) => s.status === tab);
  }, [narrowed, tab, currentUser?.id]);
  /* ── Badge count for Invites ── */
  const inviteCount = useMemo(() => {
    return narrowed.filter((s) => {
      if (s.status === "Cancelled") return false;
      if (s.organizerId === currentUser?.id) return false;
      const myLink = s.players?.find((p) => p.userId === currentUser?.id);
      return myLink && sessionPlayerGuards.isPending(myLink);
    }).length;
  }, [narrowed, currentUser?.id]);
  const goCreate = () => router.push("/(app)/games/sessions/create");
  const goDetail = (id: string) => router.push(`/(app)/games/sessions/${id}`);
  if (loading && !sessions.length) return <ScreenLayout title={t("sessions.title")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;
  const countFor = (key: TabKey) => key === "Invites" ? inviteCount : narrowed.filter(s => s.status === key).length;
  /* ── Card ── */
  const renderCard = ({ item }: { item: GameSession }) => {
    const when = item.scheduledStartDate ? formatDateTime(item.scheduledStartDate, i18n.language) : "—";
    const deadline = item.effectiveDeadline ? formatDateTime(item.effectiveDeadline, i18n.language) : null;
    const myLink = item.players?.find((p) => p.userId === currentUser?.id);
    const isPending = myLink ? sessionPlayerGuards.isPending(myLink) : false;
    const tone = SESSION_STATUS_COLORS[item.status];
    // The list endpoint does not include matches (S-LIST02): show the count only when it is known.
    const matchCount = item.matches?.length ?? 0;
    return (
      <TouchableOpacity style={styles.card} onPress={() => goDetail(item.id)} accessibilityRole="button"
        accessibilityLabel={[item.name, `${t("sessions.plannedGame")}: ${item.plannedGameName || t("sessions.plannedUndecided")}`].join(". ")}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={[styles.statusPill, { color: tone, backgroundColor: tone + "1F" }]}>{t("sessions.status." + item.status)}</Text>
        </View>
        <Text style={styles.cardSub}>{[when, item.location].filter(Boolean).join(" · ")}</Text>
        <View style={styles.planned}>
          <GameThumb game={item.plannedGameId ? { id: item.plannedGameId, name: item.plannedGameName ?? "", imageUrl: item.plannedGameImageUrl } : null} size={32} />
          <Text style={[styles.cardSub, styles.plannedText]} numberOfLines={2}>{t("sessions.plannedGame")}: <Text style={item.plannedGameName ? styles.plannedName : undefined}>{item.plannedGameName || t("sessions.plannedUndecided")}</Text></Text>
        </View>
        {item.status === "Upcoming" && deadline && (
          <Text style={styles.deadlineText}>{t(item.responseDeadline ? "sessions.replyBy" : "sessions.replyByStart", { date: deadline })}</Text>
        )}
        <View style={styles.cardFooter}>
          <SessionAttendance players={item.players ?? []} compact />
          {matchCount > 0 && <Text style={styles.cardMetaText}>{t("sessions.matches", { count: matchCount })}</Text>}
          {tab === "Invites" && isPending && <Text style={styles.pendingBadge}>{t("sessions.awaiting")}</Text>}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <ScreenLayout title={t("sessions.title")}>
      <View style={styles.headerRow}>
        {!embedded && <PrimaryButton title={t("sessions.create")} icon={<Glyph name="plus" size={20} color={COLORS.onPrimary} />} onPress={goCreate} />}
        <SearchField value={search} onChangeText={setSearch} placeholder={t("sessions.list.search")} />
        <FilterChips items={TABS.map(key => ({ key, label: t("sessions.tabs." + key), count: countFor(key) }))} value={tab} onChange={setTab} />
        <ListToolbar filterCount={planned === undefined ? 0 : 1} onFilters={() => setFiltersVisible(true)} />
        <ActiveFilters items={plannedLabel ? [{ key: "planned", label: `${t("sessions.list.plannedFilter")}: ${plannedLabel}`, onRemove: () => setPlanned(undefined) }] : []} onClearAll={() => setPlanned(undefined)} />
      </View>
      {loadError && <ScreenState error message={t("sessions.listError")} onRetry={load} retryLabel={t("ui.retry")} />}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderCard}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        ListEmptyComponent={loadError ? null : (search.trim() || planned !== undefined) && sessions.length > 0
          ? <NoResults detail={t("sessions.list.noneFound")} onAdjust={() => setFiltersVisible(true)} onClear={() => { setSearch(""); setPlanned(undefined); }} />
          : <ScreenState message={t("sessions.empty." + tab)} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
      />
      <FilterSheet visible={filtersVisible} value={planned} empty={undefined} onApply={setPlanned} onClose={() => setFiltersVisible(false)}
        activeCount={v => v === undefined ? 0 : 1}>
        {(draft, setDraft) => <OptionGroup title={t("sessions.list.plannedFilter")} options={plannedOptions} selected={draft === undefined ? [] : [draft]} onChange={next => setDraft(next[0])} />}
      </FilterSheet>
    </ScreenLayout>
  );
}
/* ── Styles ── */
const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32, gap: 8 },
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, gap: 4 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitle: { flex: 1, minWidth: 0, fontSize: 17, lineHeight: 22, fontWeight: "600", color: COLORS.onBackground },
  statusPill: { fontSize: 12, lineHeight: 18, fontWeight: "600", paddingHorizontal: 9, paddingVertical: 1, borderRadius: 999, overflow: "hidden" },
  cardSub: { fontSize: 13, lineHeight: 18, color: COLORS.textMuted },
  planned: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  plannedText: { flex: 1, minWidth: 0 },
  plannedName: { fontWeight: "600", color: COLORS.onBackground },
  deadlineText: { fontSize: 13, lineHeight: 18, color: COLORS.secondary, fontWeight: "600" },
  cardFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 6 },
  cardMetaText: { fontSize: 13, lineHeight: 18, color: COLORS.textMuted },
  pendingBadge: { fontSize: 12, lineHeight: 18, fontWeight: "600", color: COLORS.secondary, backgroundColor: "#FFF7DE", paddingHorizontal: 9, paddingVertical: 1, borderRadius: 999, overflow: "hidden" },
});
