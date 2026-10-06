/**
 * SessionsListScreen.tsx
 *
 * Lista de sessões com 4 tabs:
 *   - Ativas    → sessões em curso
 *   - Agendadas → sessões futuras
 *   - Encerradas → sessões fechadas
 *   - Convites  → sessões onde fui convidado e ainda não respondi
 */
import { SESSION_STATUS_COLORS } from "@/src/styles/statusColors";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import sessionService from "@/src/features/games/sessions/services/sessionService";
import { GameSession, getStatusColor } from "@/src/features/games/sessions/types/GameSession";
import { sessionPlayerGuards } from "@/src/features/games/sessions/types/GameSessionPlayer";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { RootState } from "@/src/store/store";
type TabKey = "Active" | "Upcoming" | "Closed" | "Invites";
const TABS: { key: TabKey; icon: string }[] = [
  { key: "Active",    icon: "play-circle-filled" },
  { key: "Upcoming",  icon: "schedule" },
  { key: "Closed",    icon: "check-circle" },
  { key: "Invites",   icon: "mail" },
];
export default function SessionsListScreen() {
  const { t, i18n } = useTranslation("matches");
  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("Active");
  const [loadError, setLoadError] = useState(false);
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
  const filtered = useMemo(() => {
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
  }, [sessions, tab, currentUser?.id]);
  /* ── Badge count for Invites ── */
  const inviteCount = useMemo(() => {
    return sessions.filter((s) => {
      if (s.status === "Cancelled") return false;
      if (s.organizerId === currentUser?.id) return false;
      const myLink = s.players?.find((p) => p.userId === currentUser?.id);
      return myLink && sessionPlayerGuards.isPending(myLink);
    }).length;
  }, [sessions, currentUser?.id]);
  const goCreate = () => router.push("/(app)/games/sessions/create");
  const goDetail = (id: string) => router.push(`/(app)/games/sessions/${id}`);
  if (loading && !sessions.length) return <ScreenLayout title={t("sessions.title")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;
  /* ── Card ── */
  const renderCard = ({ item }: { item: GameSession }) => {
    const when = item.scheduledStartDate
      ? new Date(item.scheduledStartDate).toLocaleString(locale, {
          weekday: "short", day: "numeric", month: "short",
          hour: "2-digit", minute: "2-digit",
        })
      : "—";
    const deadline = item.effectiveDeadline
      ? new Date(item.effectiveDeadline).toLocaleString(locale, {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        })
      : null;
    const acceptedCount = item.acceptedGuestCount ?? 0;
    const totalInvited = (item.players?.length ?? 1) - 1; // exclude organizer
    // My invite status (for Invites tab)
    const myLink = item.players?.find((p) => p.userId === currentUser?.id);
    const isPending = myLink ? sessionPlayerGuards.isPending(myLink) : false;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => goDetail(item.id)}
        activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={item.name}
      >
        {/* Status pill */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: SESSION_STATUS_COLORS[item.status] + "20" }]}>
            <Text style={[styles.statusText, { color: SESSION_STATUS_COLORS[item.status] }]}>
              {t("sessions.status." + item.status)}
            </Text>
          </View>
        </View>
        {!!item.location && (
          <Text style={styles.cardSub}>📍 {item.location}</Text>
        )}
        <Text style={styles.cardSub}>🗓 {when}</Text>
        {/* Deadline (só para Upcoming) */}
        {item.status === "Upcoming" && deadline && (
          <Text style={styles.deadlineText}>⏰ {t(item.responseDeadline ? "sessions.replyBy" : "sessions.replyByStart", { date: deadline })}</Text>
        )}
        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            <MaterialIcons name="people" size={14} color={COLORS.textMuted} />
            <Text style={styles.cardMetaText}>{t("sessions.confirmed", { accepted: acceptedCount, total: totalInvited })}</Text>
          </View>
          <View style={styles.cardMeta}>
            <MaterialIcons name="sports-esports" size={14} color={COLORS.textMuted} />
            <Text style={styles.cardMetaText}>{t("sessions.matches", { count: item.matches?.length ?? 0 })}</Text>
          </View>
          {/* Pending badge */}
          {tab === "Invites" && isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{t("sessions.awaiting")}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <ScreenLayout title={t("sessions.title")}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.createBtn} onPress={goCreate} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t("sessions.create")}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>{t("sessions.create")}</Text>
        </TouchableOpacity>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(({ key, icon }) => {
          const active = tab === key;
          const badge = key === "Invites" && inviteCount > 0 ? inviteCount : 0;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.85} accessibilityRole="tab" accessibilityLabel={t("sessions.tabs." + key)} accessibilityState={{ selected: tab === key }}
            >
              <MaterialIcons
                name={icon as any}
                size={16}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t("sessions.tabs." + key)}
              </Text>
              {badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {loadError && <ScreenState error message={t("sessions.listError")} onRetry={load} retryLabel={t("ui.retry")} />}
      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderCard}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} />}
        ListEmptyComponent={loadError ? null :
          <View style={styles.emptyWrap}>
            <MaterialIcons name="inbox" size={40} color="#ddd" />
            <Text style={styles.emptyText}>
              {t("sessions.empty." + tab)}
            </Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      />
    </ScreenLayout>
  );
}
/* ── Styles ── */
const styles = StyleSheet.create({
  headerRow: { padding: 16, gap: 12 },
  createBtn: { ...UI_STYLES.button, flexDirection: "row", gap: 8, backgroundColor: COLORS.primary },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  tabBtn: { ...UI_STYLES.control, flexGrow: 1, flexBasis: "40%", padding: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  tabBtnActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  tabText: { ...UI_STYLES.caption, color: COLORS.textMuted, fontWeight: "700", textAlign: "center" },
  tabTextActive: { color: COLORS.primary },
  tabBadge: {
    backgroundColor: COLORS.error, borderRadius: 999,
    minWidth: 24, minHeight: 24, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6, paddingVertical: 2,
  },
  tabBadgeText: { color: "#fff", ...UI_STYLES.caption, fontWeight: "800" },
  card: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 },
  cardTitle: { ...UI_STYLES.section, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { ...UI_STYLES.caption, fontWeight: "700" },
  cardSub: { ...UI_STYLES.body, color: COLORS.textMuted, marginTop: 4 },
  deadlineText: { ...UI_STYLES.caption, color: COLORS.secondary, marginTop: 8 },
  cardFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 12 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" },
  cardMetaText: { ...UI_STYLES.caption, color: COLORS.textMuted },
  pendingBadge: { backgroundColor: "#fff3cd", padding: 8, borderRadius: 12 },
  pendingBadgeText: { color: "#856404", ...UI_STYLES.caption, fontWeight: "700" },
  emptyWrap: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyText: { ...UI_STYLES.empty },
});
