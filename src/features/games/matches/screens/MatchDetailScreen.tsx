import { useTranslation } from "react-i18next";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenState from "@/src/components/ui/ScreenState";
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
  Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";

import matchService from "../services/matchService";
import { MatchDto } from "../types/MatchForm";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";

export default function MatchDetailScreen() {
  const { t, i18n } = useTranslation("matches");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [match, setMatch] = useState<MatchDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setNotFound(false);
    setLoadError(false);
    setLoading(true);
    try {
      const data = await matchService.getById(id);
      if (!data) setNotFound(true);
      setMatch(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <SafeAreaView style={styles.screen}><ScreenHeader title={t("ui.detailsTitle")} appearance="refresh" leftAccessibilityLabel={t("ui.back")} /><ScreenState loading message={t("ui.loading")} /></SafeAreaView>;

  if (loadError || notFound || !match) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader title={t("ui.detailsTitle")} appearance="refresh" leftAccessibilityLabel={t("ui.back")} />
        <ScreenState error={loadError} message={t(loadError ? "ui.loadError" : "ui.notFound")} onRetry={load} retryLabel={t("ui.retry")} />
      </SafeAreaView>
    );
  }

  const players = [...match.players].sort((a, b) => (a.rankPosition ?? 99) - (b.rankPosition ?? 99));
  const isMine = (userId: string) => userId === currentUser?.id;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom", "top"]}>
      <ScreenHeader title={t("ui.detailsTitle")} appearance="refresh" leftAccessibilityLabel={t("ui.back")} />
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
            <Text style={styles.gameName} >{match.gameName}</Text>
            <Text style={styles.date}>{formatDate(match.matchDate, i18n.language)}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("ui.viewGame")} onPress={() => router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: match.gameId } } as never)}>
              <Text style={styles.link}>{t("ui.viewGame")}</Text>
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
          <Text style={styles.sectionTitle}>{t("steps.players")}</Text>
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
                <Text style={[styles.playerName, isMine(p.userId) && styles.playerNameMine]}>
                  {isMine(p.userId) ? t("players.you") : p.userName ?? t("players.player")}
                </Text>
                {typeof p.score === "number" && <Text style={styles.playerScore}>{t("ui.points", { score: p.score })}</Text>}
              </View>
            ))}
          </View>
        </View>

        {!!match.scoreSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("ui.summary")}</Text>
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

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },

  header: { flexDirection: "row", alignItems: "center" },
  cover: { width: 76, height: 76, borderRadius: 14, backgroundColor: COLORS.surface },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1, marginLeft: 14 },
  gameName: { ...UI_STYLES.title },
  date: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 4 },
  link: { ...UI_STYLES.body, color: COLORS.primary, fontWeight: "700", paddingVertical: 12 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  metaChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  metaChipText: { ...UI_STYLES.caption, color: COLORS.textMuted, flexShrink: 1 },

  section: { marginTop: 22 },
  sectionTitle: { ...UI_STYLES.section, marginBottom: 12 },
  // Sem overflow:"hidden" — no iOS isso corta a sombra do card.
  card: { ...UI_STYLES.card },

  playerRow: { flexDirection: "row", alignItems: "center", padding: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  playerRowLast: { borderBottomWidth: 0 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
  rankBadgeWinner: { backgroundColor: COLORS.star },
  rankBadgeText: { fontWeight: "800", color: COLORS.textMuted, fontSize: 12 },
  playerName: { ...UI_STYLES.body, flex: 1, marginLeft: 12, fontWeight: "700" },
  playerNameMine: { color: COLORS.primary },
  playerScore: { ...UI_STYLES.body, fontWeight: "800", flexShrink: 1 },

  scoreSummary: { ...UI_STYLES.body, padding: 16 },
});
