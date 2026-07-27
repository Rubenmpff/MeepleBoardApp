/**
 * DashboardScreen.tsx
 */

import React, { useRef, useMemo } from "react";
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, TouchableWithoutFeedback,
  Animated, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

import AppHeader from "@/src/features/dashboard/components/AppHeader";
import SectionCard from "@/src/features/dashboard/components/SectionCard";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";
import { useLastMatch } from "../hooks/useLastMatch";
import { useGameSessions } from "@/src/features/games/hooks/useGameSessions";
import { usePendingJournal } from "@/src/features/games/hooks/usePendingJournal";
import { ROUTES } from "@/src/constants/routes";

export default function DashboardScreen() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: lastMatch, loading: lastMatchLoading } = useLastMatch();
  const { sessions } = useGameSessions();
  const { count: pendingJournalCount } = usePendingJournal();

  /* ── Stats calculadas a partir das sessões ── */
  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === "Active").length,
    [sessions]
  );

  const pendingInvites = useMemo(
    () => sessions.filter((s) => {
      if (s.organizerId === user?.id) return false;
      const myLink = s.players?.find((p) => p.userId === user?.id);
      return myLink?.status === "Pending" || (myLink as any)?.status === 0;
    }).length,
    [sessions, user?.id]
  );

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.status === "Upcoming").length,
    [sessions]
  );

  /* ── Saudação por hora ── */
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 19) return "Boa tarde";
    return "Boa noite";
  }, []);

  /* ── Ações rápidas ── */
  const quickActions = [
    {
      title: "Registar Partida",
      description: "Regista uma partida rápida",
      icon: <MaterialIcons name="sports-esports" size={32} color={COLORS.primary} />,
      onPress: () => router.push("/games/register-match"),
      borderColor: COLORS.primary,
      badge: null,
    },
    {
      title: "Sessões",
      description: "Gerir sessões de jogo",
      icon: <MaterialIcons name="event-note" size={32} color={COLORS.secondary} />,
      onPress: () => router.push(ROUTES.SESSIONS),
      borderColor: COLORS.secondary,
      badge: pendingInvites > 0 ? pendingInvites : null,
    },
    {
      title: "Biblioteca",
      description: "A tua coleção de jogos",
      icon: <MaterialCommunityIcons name="bookshelf" size={32} color={COLORS.success} />,
      onPress: () => router.push("/games/library"),
      borderColor: COLORS.success,
      badge: null,
    },
    {
      title: "Campanhas",
      description: "Acompanhar campanhas",
      icon: <MaterialIcons name="explore" size={32} color="#9C27B0" />,
      onPress: () => router.push("/(app)/games/campaigns" as any),
      borderColor: "#9C27B0",
      badge: null,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.wrapper}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader username={user?.userName} />

        {/* ── Saudação ── */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.greetingName}>{user?.userName ?? "Jogador"} 👋</Text>
          </View>
        </View>

        {/* ── Stats rápidas ── */}
        {(activeSessions > 0 || pendingInvites > 0 || upcomingSessions > 0 || pendingJournalCount > 0) && (
          <View style={styles.statsRow}>
            {activeSessions > 0 && (
              <StatChip
                icon="play-circle-filled"
                color={COLORS.success}
                label={`${activeSessions} sessão${activeSessions > 1 ? "ões" : ""} ativa${activeSessions > 1 ? "s" : ""}`}
                onPress={() => router.push(ROUTES.SESSIONS)}
              />
            )}
            {pendingInvites > 0 && (
              <StatChip
                icon="mail"
                color={COLORS.error}
                label={`${pendingInvites} convite${pendingInvites > 1 ? "s" : ""} pendente${pendingInvites > 1 ? "s" : ""}`}
                onPress={() => router.push(ROUTES.SESSIONS)}
              />
            )}
            {upcomingSessions > 0 && (
              <StatChip
                icon="schedule"
                color="#f39c12"
                label={`${upcomingSessions} agendada${upcomingSessions > 1 ? "s" : ""}`}
                onPress={() => router.push(ROUTES.SESSIONS)}
              />
            )}
            {/* ── Avaliações pendentes ── */}
            {pendingJournalCount > 0 && (
              <StatChip
                icon="star-border"
                color="#E91E63"
                label={`${pendingJournalCount} avaliação${pendingJournalCount > 1 ? "ões" : ""} pendente${pendingJournalCount > 1 ? "s" : ""}`}
                onPress={() => router.push("/(app)/games/pending-journal" as any)}
              />
            )}
          </View>
        )}

        {/* ── Última partida ── */}
        <Text style={styles.sectionTitle}>Última partida</Text>
        <SectionCard>
          {lastMatchLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : lastMatch ? (
            <View style={styles.lastMatchWrap}>
              <View style={styles.lastMatchIcon}>
                <MaterialIcons name="sports-esports" size={28} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lastMatchName}>{lastMatch.name}</Text>
                <Text style={styles.lastMatchDetail}>🏆 {lastMatch.winner}</Text>
                <Text style={styles.lastMatchDate}>📅 {lastMatch.date}</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/games/register-match")}
                style={styles.playAgainBtn}
              >
                <MaterialIcons name="replay" size={16} color={COLORS.primary} />
                <Text style={styles.playAgainText}>Jogar{"\n"}de novo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyBlock}>
              <LottieView
                source={require("@/assets/animations/ghost.json")}
                autoPlay loop
                style={styles.lottie}
              />
              <Text style={styles.emptyText}>Ainda não tens partidas registadas.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/games/register-match")}
              >
                <Text style={styles.emptyBtnText}>Registar primeira partida</Text>
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* ── Avaliações pendentes — card de destaque ── */}
        {pendingJournalCount > 0 && (
          <TouchableOpacity
            style={styles.pendingJournalCard}
            onPress={() => router.push("/(app)/games/pending-journal" as any)}
            activeOpacity={0.85}
          >
            <View style={styles.pendingJournalIcon}>
              <MaterialIcons name="star" size={22} color="#E91E63" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingJournalTitle}>
                {pendingJournalCount} partida{pendingJournalCount > 1 ? "s" : ""} à espera da tua avaliação
              </Text>
              <Text style={styles.pendingJournalSub}>
                Os outros jogadores estão à espera!
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#E91E63" />
          </TouchableOpacity>
        )}

        {/* ── Ações rápidas ── */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Ações rápidas</Text>
        <View style={styles.cardGrid}>
          {quickActions.map((action, index) => (
            <AnimatedCard key={index} action={action} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Sub-components ── */

function StatChip({ icon, color, label, onPress }: {
  icon: string; color: string; label: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.statChip, { borderColor: color + "40", backgroundColor: color + "10" }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon as any} size={14} color={color} />
      <Text style={[styles.statChipText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function AnimatedCard({ action }: {
  action: {
    title: string; description: string; icon: React.ReactNode;
    onPress: () => void; borderColor: string; badge: number | null;
  }
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    action.onPress();
  };

  return (
    <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[
        styles.actionCard,
        { borderColor: action.borderColor + "60", transform: [{ scale }] }
      ]}>
        {action.badge !== null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{action.badge}</Text>
          </View>
        )}
        <View style={[styles.iconWrap, { backgroundColor: action.borderColor + "15" }]}>
          {action.icon}
        </View>
        <Text style={styles.cardTitle}>{action.title}</Text>
        <Text style={styles.cardDesc}>{action.description}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  wrapper: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, backgroundColor: COLORS.background },

  greetingRow: { marginBottom: 16, marginTop: 4 },
  greetingText: { fontSize: 16, color: "#888", fontWeight: "500" },
  greetingName: { fontSize: 26, fontWeight: "800", color: COLORS.primary },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  statChipText: { fontSize: 12, fontWeight: "700" },

  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground, marginBottom: 10 },

  loadingWrap: { paddingVertical: 20, alignItems: "center" },
  lastMatchWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  lastMatchIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center" },
  lastMatchName: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground, marginBottom: 3 },
  lastMatchDetail: { fontSize: 13, color: "#555", marginBottom: 2 },
  lastMatchDate: { fontSize: 12, color: "#999" },
  playAgainBtn: { alignItems: "center", padding: 10, borderRadius: 12, backgroundColor: COLORS.primary + "10" },
  playAgainText: { fontSize: 11, fontWeight: "700", color: COLORS.primary, textAlign: "center", marginTop: 3 },

  emptyBlock: { alignItems: "center", paddingVertical: 8 },
  emptyText: { fontSize: 14, color: "#888", marginTop: 4, marginBottom: 12 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  lottie: { width: 100, height: 100 },

  // Avaliações pendentes — card de destaque
  pendingJournalCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FCE4EC", borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: "#F48FB1",
  },
  pendingJournalIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#E91E6320", alignItems: "center", justifyContent: "center",
  },
  pendingJournalTitle: { fontSize: 14, fontWeight: "800", color: "#C2185B" },
  pendingJournalSub: { fontSize: 12, color: "#E91E63", marginTop: 2 },

  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "47%", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1.5, paddingVertical: 18, paddingHorizontal: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3, alignItems: "center", position: "relative" },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: "800", textAlign: "center", color: COLORS.onBackground, marginBottom: 4 },
  cardDesc: { fontSize: 11, textAlign: "center", color: "#888", lineHeight: 15 },
  badge: { position: "absolute", top: 10, right: 10, backgroundColor: COLORS.error, borderRadius: 999, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});