/**
 * SessionsListScreen.tsx
 *
 * Lista de sessões com 4 tabs:
 *   - Ativas    → sessões em curso
 *   - Agendadas → sessões futuras
 *   - Encerradas → sessões fechadas
 *   - Convites  → sessões onde fui convidado e ainda não respondi
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import sessionService from "@/src/features/games/services/sessionService";
import { GameSession, GameSessionStatus, getStatusColor } from "@/src/features/games/types/GameSession";
import { sessionPlayerGuards } from "@/src/features/games/types/GameSessionPlayer";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";

type TabKey = "Active" | "Upcoming" | "Closed" | "Invites";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "Active",    label: "Ativas",     icon: "play-circle-filled" },
  { key: "Upcoming",  label: "Agendadas",  icon: "schedule" },
  { key: "Closed",    label: "Encerradas", icon: "check-circle" },
  { key: "Invites",   label: "Convites",   icon: "mail" },
];

export default function SessionsListScreen() {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>("Active");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sessionService.getMine();
      setSessions(data ?? []);
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

  /* ── Card ── */
  const renderCard = ({ item }: { item: GameSession }) => {
    const when = item.scheduledStartDate
      ? new Date(item.scheduledStartDate).toLocaleString("pt-PT", {
          weekday: "short", day: "numeric", month: "short",
          hour: "2-digit", minute: "2-digit",
        })
      : "—";

    const deadline = item.effectiveDeadline
      ? new Date(item.effectiveDeadline).toLocaleString("pt-PT", {
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
        activeOpacity={0.85}
      >
        {/* Status pill */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status === "Upcoming" ? "Agendada"
                : item.status === "Active" ? "Ativa"
                : item.status === "Closed" ? "Encerrada"
                : "Cancelada"}
            </Text>
          </View>
        </View>

        {!!item.location && (
          <Text style={styles.cardSub}>📍 {item.location}</Text>
        )}
        <Text style={styles.cardSub}>🗓 {when}</Text>

        {/* Deadline (só para Upcoming) */}
        {item.status === "Upcoming" && deadline && (
          <Text style={styles.deadlineText}>⏰ Prazo de resposta: {deadline}</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            <MaterialIcons name="people" size={14} color="#888" />
            <Text style={styles.cardMetaText}>{acceptedCount}/{totalInvited} confirmados</Text>
          </View>
          <View style={styles.cardMeta}>
            <MaterialIcons name="sports-esports" size={14} color="#888" />
            <Text style={styles.cardMetaText}>{item.matches?.length ?? 0} partidas</Text>
          </View>

          {/* Pending badge */}
          {tab === "Invites" && isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>A aguardar resposta</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sessões</Text>
        <TouchableOpacity style={styles.createBtn} onPress={goCreate} activeOpacity={0.85}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Criar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          const badge = key === "Invites" && inviteCount > 0 ? inviteCount : 0;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={icon as any}
                size={16}
                color={active ? COLORS.primary : "#aaa"}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
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

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderCard}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="inbox" size={40} color="#ddd" />
            <Text style={styles.emptyText}>
              {tab === "Active"   ? "Sem sessões ativas."
                : tab === "Upcoming"  ? "Sem sessões agendadas."
                : tab === "Closed"    ? "Sem sessões encerradas."
                : "Sem convites pendentes."}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: COLORS.background },

  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  createBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  tabsRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee",
  },
  tabBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "0A" },
  tabText: { fontSize: 11, fontWeight: "700", color: "#aaa" },
  tabTextActive: { color: COLORS.primary },
  tabBadge: {
    backgroundColor: COLORS.error, borderRadius: 999,
    minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardSub: { color: "#666", fontSize: 13, marginTop: 3 },
  deadlineText: { color: "#f39c12", fontSize: 12, fontWeight: "600", marginTop: 4 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { color: "#888", fontSize: 12, fontWeight: "600" },
  pendingBadge: {
    marginLeft: "auto", backgroundColor: "#fff3cd",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  pendingBadgeText: { color: "#856404", fontSize: 11, fontWeight: "700" },

  emptyWrap: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyText: { color: "#aaa", fontWeight: "600", fontSize: 14 },
});