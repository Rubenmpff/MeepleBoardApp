import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenState from "@/src/components/ui/ScreenState";
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
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import matchService from "@/src/features/games/matches/services/matchService";
import { MatchDto } from "@/src/features/games/matches/types/MatchForm";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

export default function PendingJournalScreen() {
  const { t, i18n } = useTranslation("matches");
  const router = useRouter();
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      setLoadError(false);
      if (!silent) setLoading(true);
      const data = await matchService.getPendingJournalMatches();
      setMatches(data);
    } catch (err) {
      setLoadError(true);
      console.error("Erro ao carregar partidas pendentes", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader title={t("ui.pendingTitle")} appearance="refresh" leftAccessibilityLabel={t("ui.back")} />
        <ScreenState loading message={t("ui.loading")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t("ui.pendingTitle")} appearance="refresh" leftAccessibilityLabel={t("ui.back")} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.infoText}>{t("ui.pendingCount", { count: matches.length })}</Text>

        {matches.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {matches.length}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {loadError ? <ScreenState error message={t("ui.pendingError")} onRetry={() => load()} retryLabel={t("ui.retry")} /> : matches.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons
              name="check-circle"
              size={56}
              color="#ddd"
            />

            <Text style={styles.emptyTitle}>
              {t("ui.emptyTitle")}
            </Text>

            <Text style={styles.emptyText}>
              {t("ui.emptyBody")}
            </Text>
          </View>
        ) : (
          <>
            {matches.map((match) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("ui.evaluate") + ": " + match.gameName}
                key={match.id}
                style={styles.card}
                onPress={() =>
                  router.push(
                    `/(app)/games/matches/${match.id}/journal` as any
                  )
                }
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <MaterialIcons
                      name="sports-esports"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.gameName}>
                      {match.gameName}
                    </Text>

                    <Text style={styles.matchDate}>
                      {new Date(match.matchDate).toLocaleDateString(
                        i18n.language === "pt" ? "pt-PT" : "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </Text>
                  </View>

                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={COLORS.textMuted}
                  />
                </View>

                {/* Jogadores */}
                {match.players && match.players.length > 0 && (
                  <View style={styles.playersRow}>
                    <MaterialIcons
                      name="people"
                      size={13}
                      color={COLORS.textMuted}
                    />

                    <Text style={styles.playersText}>
                      {match.players
                        .map((p) => p.userName)
                        .join(", ")}
                    </Text>
                  </View>
                )}

                {/* Meta */}
                <View style={styles.metaRow}>
                  {match.durationInMinutes && (
                    <Text style={styles.metaText}>
                      ⏱ {match.durationInMinutes} min
                    </Text>
                  )}

                  {match.location && (
                    <Text style={styles.metaText}>
                      📍 {match.location}
                    </Text>
                  )}

                  {match.isSoloGame && (
                    <Text style={styles.metaText}>
                      👤 Solo
                    </Text>
                  )}
                </View>

                <View style={styles.evaluateBtn}>
                  <MaterialIcons
                    name="star-border"
                    size={14}
                    color={COLORS.primary}
                  />

                  <Text style={styles.evaluateBtnText}>
                    {t("ui.evaluate")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },


  content: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },


  headerBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  headerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },


  infoText: { ...UI_STYLES.body, flex: 1 },

  card: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },

  gameName: { ...UI_STYLES.section },

  matchDate: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 4 },

  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },

  playersText: { ...UI_STYLES.caption, color: COLORS.textMuted, flex: 1 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },

  metaText: { ...UI_STYLES.caption, color: COLORS.textMuted },

  evaluateBtn: { ...UI_STYLES.control, flexDirection: "row", gap: 8, backgroundColor: COLORS.primarySoft, paddingHorizontal: 12, alignSelf: "flex-start" },

  evaluateBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },

  emptyTitle: { ...UI_STYLES.section },

  emptyText: { ...UI_STYLES.body, color: COLORS.textMuted, textAlign: "center" },
});
