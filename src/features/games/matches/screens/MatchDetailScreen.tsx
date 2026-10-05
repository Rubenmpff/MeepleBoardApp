/**
 * MatchDetailScreen.tsx
 *
 * Ecrã leve e neutro de detalhe de uma partida: jogo, data, jogadores,
 * pontuações, vencedor, duração e local. Não é o diário pessoal
 * (isso é o MatchJournalScreen) — aqui não há rating/notas/fotos,
 * só o resumo factual da partida, igual para quem quer que a veja.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";

import matchService from "../services/matchService";
import { MatchDto } from "../types/MatchForm";
import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [match, setMatch] = useState<MatchDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await matchService.getById(id);
      if (!data) setNotFound(true);
      setMatch(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;

  if (notFound || !match) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="dice-outline" size={40} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>Partida não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const players = [...match.players].sort((a, b) => (a.rankPosition ?? 99) - (b.rankPosition ?? 99));
  const isMine = (userId: string) => userId === currentUser?.id;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom", "top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {match.gameImageUrl ? (
            <Image source={{ uri: match.gameImageUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="dice-outline" size={32} color={COLORS.textMuted} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.gameName} numberOfLines={2}>{match.gameName}</Text>
            <Text style={styles.date}>{formatDate(match.matchDate)}</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: match.gameId } } as never)}>
              <Text style={styles.link}>Ver jogo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metaRow}>
          {typeof match.durationInMinutes === "number" && (
            <MetaChip icon="time-outline" label={duration(match.durationInMinutes)} />
          )}
          {!!match.location && <MetaChip icon="location-outline" label={match.location} />}
          {match.isSoloGame && <MetaChip icon="person-outline" label="Solo" />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogadores</Text>
          <View style={styles.card}>
            {players.map((p, index) => (
              <View key={p.id ?? p.userId} style={[styles.playerRow, index === players.length - 1 && styles.playerRowLast]}>
                <View style={[styles.rankBadge, p.isWinner && styles.rankBadgeWinner]}>
                  {p.isWinner ? (
                    <Ionicons name="trophy" size={14} color="#fff" />
                  ) : (
                    <Text style={styles.rankBadgeText}>{p.rankPosition ?? index + 1}</Text>
                  )}
                </View>
                <Text style={[styles.playerName, isMine(p.userId) && styles.playerNameMine]} numberOfLines={1}>
                  {isMine(p.userId) ? "Tu" : p.userName ?? "Jogador"}
                </Text>
                {typeof p.score === "number" && <Text style={styles.playerScore}>{p.score} pts</Text>}
              </View>
            ))}
          </View>
        </View>

        {!!match.scoreSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <View style={styles.card}><Text style={styles.scoreSummary}>{match.scoreSummary}</Text></View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={14} color={COLORS.textMuted} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

const cardShadow = {
  shadowColor: "#0B1220",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background, gap: 10 },
  emptyTitle: { color: COLORS.textMuted, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 40 },

  header: { flexDirection: "row", alignItems: "center" },
  cover: { width: 76, height: 76, borderRadius: 14, backgroundColor: COLORS.surface },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1, marginLeft: 14 },
  gameName: { fontSize: 20, fontWeight: "800", color: COLORS.onBackground },
  date: { marginTop: 3, color: COLORS.textMuted, fontSize: 13 },
  link: { marginTop: 6, color: COLORS.primary, fontWeight: "700", fontSize: 13 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  metaChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  metaChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },

  section: { marginTop: 22 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground, marginBottom: 9 },
  // Sem overflow:"hidden" — no iOS isso corta a sombra do card.
  card: { backgroundColor: COLORS.card, borderRadius: 16, ...cardShadow },

  playerRow: { flexDirection: "row", alignItems: "center", padding: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  playerRowLast: { borderBottomWidth: 0 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
  rankBadgeWinner: { backgroundColor: COLORS.star },
  rankBadgeText: { fontWeight: "800", color: COLORS.textMuted, fontSize: 12 },
  playerName: { flex: 1, marginLeft: 11, fontWeight: "700", color: COLORS.onBackground },
  playerNameMine: { color: COLORS.primary },
  playerScore: { fontWeight: "800", color: COLORS.onBackground },

  scoreSummary: { padding: 14, color: COLORS.onBackground, lineHeight: 20 },
});