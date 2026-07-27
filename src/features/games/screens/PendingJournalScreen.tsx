/**
 * PendingJournalScreen.tsx
 *
 * Lista de partidas pendentes de avaliação do utilizador.
 * Acessível via:
 *   - Dashboard (se houver partidas pendentes)
 *   - Notificação push
 *
 * Rota: /(app)/games/pending-journal
 */

import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import matchService from "@/src/features/games/services/matchService";
import { MatchDto } from "@/src/features/games/types/MatchForm";
import { COLORS } from "@/src/constants/colors";

export default function PendingJournalScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await matchService.getPendingJournalMatches();
      setMatches(data);
    } catch (err) {
      console.error("Erro ao carregar partidas pendentes", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Avaliações pendentes</Text>
        {matches.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{matches.length}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {matches.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="check-circle" size={56} color="#ddd" />
            <Text style={styles.emptyTitle}>Tudo em dia!</Text>
            <Text style={styles.emptyText}>
              Não tens partidas pendentes de avaliação.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={14} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Tens {matches.length} partida{matches.length > 1 ? "s" : ""} à espera da tua avaliação.
                Os outros jogadores estão à espera!
              </Text>
            </View>

            {matches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.card}
                onPress={() => router.push(`/(app)/games/matches/${match.id}/journal` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <MaterialIcons name="sports-esports" size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gameName}>{match.gameName}</Text>
                    <Text style={styles.matchDate}>
                      {new Date(match.matchDate).toLocaleDateString("pt-PT", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color="#ccc" />
                </View>

                {/* Jogadores */}
                {match.players && match.players.length > 0 && (
                  <View style={styles.playersRow}>
                    <MaterialIcons name="people" size={13} color="#aaa" />
                    <Text style={styles.playersText}>
                      {match.players.map(p => p.userName).join(", ")}
                    </Text>
                  </View>
                )}

                {/* Meta */}
                <View style={styles.metaRow}>
                  {match.durationInMinutes && (
                    <Text style={styles.metaText}>⏱ {match.durationInMinutes} min</Text>
                  )}
                  {match.location && (
                    <Text style={styles.metaText}>📍 {match.location}</Text>
                  )}
                  {match.isSoloGame && (
                    <Text style={styles.metaText}>👤 Solo</Text>
                  )}
                </View>

                <View style={styles.evaluateBtn}>
                  <MaterialIcons name="star-border" size={14} color={COLORS.primary} />
                  <Text style={styles.evaluateBtnText}>Avaliar esta partida</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  headerBadge: {
    backgroundColor: COLORS.error, borderRadius: 999,
    minWidth: 22, height: 22, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.primary + "0A", borderRadius: 12, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.primary + "25",
  },
  infoText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 18 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  cardIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center", justifyContent: "center",
  },
  gameName: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground },
  matchDate: { fontSize: 12, color: "#888", marginTop: 2 },
  playersRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  playersText: { fontSize: 12, color: "#888" },
  metaRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  metaText: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  evaluateBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primary + "10", borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, alignSelf: "flex-start",
  },
  evaluateBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  emptyWrap: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#ccc" },
  emptyText: { fontSize: 14, color: "#aaa", textAlign: "center", lineHeight: 20 },
});