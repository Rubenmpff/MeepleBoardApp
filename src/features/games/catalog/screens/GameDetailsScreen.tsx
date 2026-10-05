/**
 * GameDetailsScreen.tsx
 *
 * Ecrã de detalhe de um jogo com 3 tabs:
 *   - Info       → dados do BGG (descrição, categorias, peso)
 *   - Histórico  → partidas do utilizador com rating, notas, tags
 *   - Campanhas  → campanhas do utilizador para este jogo
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView,
  Image, StyleSheet, TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenState from "@/src/components/ui/ScreenState";
import PrimaryButton from "@/src/components/ui/PrimaryButton";

import gameService from "../services/gameService";
import matchService from "../../matches/services/matchService";
import campaignService from "../../campaigns/services/campaignService";
import { Game } from "../types/Game";
import { MatchDto } from "../../matches/types/MatchForm";
import { Campaign } from "../../campaigns/types/Campaign";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { RootState } from "@/src/store/store";

type Tab = "info" | "history" | "campaigns";

export default function GameDetailsScreen() {
  const { t, i18n } = useTranslation("games");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const dateLocale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";

  const [game, setGame] = useState<Game | null>(null);
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameError, setGameError] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState(false);
  const [tab, setTab] = useState<Tab>("info");

  const fetchGame = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      setLoading(true);
      setGameError(false);
      const data = await gameService.getById(id);
      setGame(data);
    } catch (err) {
      setGameError(true);
      console.error("Erro ao carregar jogo", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchHistory = useCallback(async () => {
    if (!id || !currentUser?.id) { setHistoryLoading(false); return; }
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const [historyRes, ratingRes] = await Promise.all([
        matchService.getHistoryByGame(id),
        matchService.getUserRatingForGame(id),
      ]);
      setMatches(historyRes);
      setUserRating(ratingRes);
    } catch (err) {
      console.error("Erro ao carregar histórico", err);
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [id, currentUser?.id]);

  const fetchCampaigns = useCallback(async () => {
    if (!id) { setCampaignsLoading(false); return; }
    setCampaignsLoading(true);
    setCampaignsError(false);
    try {
      const data = await campaignService.getByGame(id);
      setCampaigns(data);
    } catch (err) {
      console.error("Erro ao carregar campanhas", err);
      setCampaignsError(true);
    } finally {
      setCampaignsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGame(); }, [fetchGame]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
    if (tab === "campaigns") fetchCampaigns();
  }, [tab, fetchHistory, fetchCampaigns]);

  if (loading || !game || gameError) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.pageHeader}><ScreenHeader title={t("ui.detailsTitle")} appearance="refresh" leftAccessibilityLabel={t("ui.back")} /></View>
        <ScreenState loading={loading} error={gameError} message={t(loading ? "ui.loadingGame" : gameError ? "ui.loadError" : "details.notFound")}
          onRetry={gameError ? () => { void fetchGame(); } : undefined} retryLabel={t("ui.retry")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pageHeader}><ScreenHeader title={t("ui.detailsTitle")} appearance="refresh" leftAccessibilityLabel={t("ui.back")} /></View>
      {/* ── Hero ── */}
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} stickyHeaderIndices={[1]}>
        {/* Game header */}
        <View>
          {game.imageUrl ? (
            <Image source={{ uri: game.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <MaterialIcons name="sports-esports" size={60} color="#ddd" />
            </View>
          )}

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle} accessibilityRole="header">{game.name}</Text>

            {/* Ratings row */}
            <View style={styles.ratingsRow}>
              {game.averageRating && (
                <View style={styles.ratingChip}>
                  <Text style={styles.ratingChipLabel}>BGG</Text>
                  <Text style={styles.ratingChipValue}>
                    ⭐ {game.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
              {game.meepleBoardScore != null && (
                <View style={[styles.ratingChip, styles.ratingChipMeeple]}>
                  <Text style={[styles.ratingChipLabel, { color: COLORS.secondary }]}>MeepleBoard</Text>
                  <Text style={[styles.ratingChipValue, { color: COLORS.secondary }]}>
                    ⭐ {(game.meepleBoardScore / 10).toFixed(1)}
                  </Text>
                </View>
              )}
              {userRating !== null && (
                <View style={[styles.ratingChip, styles.ratingChipPersonal]}>
                  <Text style={[styles.ratingChipLabel, { color: COLORS.primary }]}>{t("details.yourRating")}</Text>
                  <Text style={[styles.ratingChipValue, { color: COLORS.primary }]}>
                    ⭐ {userRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {/* Meta chips */}
            <View style={styles.metaRow}>
              {game.yearPublished && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{game.yearPublished}</Text>
                </View>
              )}
              {game.minPlayers && game.maxPlayers && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    👥 {game.minPlayers}–{game.maxPlayers}
                  </Text>
                </View>
              )}
              {game.averageWeight && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    ⚖️ {game.averageWeight.toFixed(1)}
                  </Text>
                </View>
              )}
              {game.isCooperative && (
                <View style={[styles.chip, { backgroundColor: COLORS.secondary + "20" }]}>
                  <Text style={[styles.chipText, { color: COLORS.secondary }]}>{t("details.cooperative")}</Text>
                </View>
              )}
              {game.supportsSoloMode && (
                <View style={[styles.chip, { backgroundColor: COLORS.success + "20" }]}>
                  <Text style={[styles.chipText, { color: COLORS.success }]}>{t("details.solo")}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          {(["info", "history", "campaigns"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "info" ? i18n.t("games:details.tabs.info")
                  : t === "history" ? `${i18n.t("games:details.tabs.history")}${matches.length > 0 ? ` (${matches.length})` : ""}`
                    : `${i18n.t("games:details.tabs.campaigns")}${campaigns.length > 0 ? ` (${campaigns.length})` : ""}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ════════════════════════════
            TAB — Info
        ════════════════════════════ */}
        {tab === "info" && (
          <View style={styles.tabContent}>
            {game.description ? (
              <>
                <Text style={styles.sectionTitle}>{t("details.descriptionTitle")}</Text>
                <Text style={styles.description}>{game.description}</Text>
              </>
            ) : (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="info-outline" size={36} color="#ddd" />
                <Text style={styles.emptyText}>
                  {t("details.descriptionEmpty")}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ════════════════════════════
            TAB — Histórico
        ════════════════════════════ */}
        {tab === "history" && (
          <View style={styles.tabContent}>
            {historyLoading || historyError ? (
              <ScreenState loading={historyLoading} error={historyError} message={t(historyLoading ? "ui.loadingHistory" : "ui.loadError")}
                onRetry={historyError ? () => { void fetchHistory(); } : undefined} retryLabel={t("ui.retry")} />
            ) : matches.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="history" size={36} color="#ddd" />
                <Text style={styles.emptyText}>
                  {t("details.historyEmpty")}
                </Text>
              </View>
            ) : (
              matches.map((m, i) => (
                <View key={m.id ?? i} style={styles.matchCard}>
                  {/* Header */}
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchDate}>
                      {new Date(m.matchDate).toLocaleDateString(dateLocale, {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                    {m.personalRating && (
                      <View style={styles.matchRating}>
                        <Text style={styles.matchRatingText}>
                          {"⭐".repeat(m.personalRating)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Meta */}
                  <View style={styles.matchMeta}>
                    {m.isSoloGame && (
                      <View style={styles.matchTag}>
                        <Text style={styles.matchTagText}>{t("details.solo")}</Text>
                      </View>
                    )}
                    {m.durationInMinutes && (
                      <Text style={styles.matchMetaText}>⏱ {m.durationInMinutes} min</Text>
                    )}
                    {m.location && (
                      <Text style={styles.matchMetaText}>📍 {m.location}</Text>
                    )}
                    {m.winnerName && (
                      <Text style={styles.matchMetaText}>🏆 {m.winnerName}</Text>
                    )}
                  </View>

                  {/* Notes */}
                  {m.notes && (
                    <Text style={styles.matchNotes}>{m.notes}</Text>
                  )}

                  {/* Tags */}
                  {m.tags && (
                    <View style={styles.matchTagsRow}>
                      {m.tags.split(",").map((tag, ti) => (
                        <View key={ti} style={styles.matchTagChip}>
                          <Text style={styles.matchTagChipText}>#{tag.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ════════════════════════════
            TAB — Campanhas
        ════════════════════════════ */}
        {tab === "campaigns" && (
          <View style={styles.tabContent}>
            {/* Botão criar campanha */}
            <PrimaryButton
              title={t("details.newCampaign")}
              onPress={() => router.push(`/(app)/games/campaigns/create?gameId=${id}&gameName=${encodeURIComponent(game.name)}`)}
              icon={<MaterialIcons name="add" size={20} color="#fff" />}
            />

            {campaignsLoading || campaignsError ? (
              <ScreenState loading={campaignsLoading} error={campaignsError} message={t(campaignsLoading ? "ui.loadingCampaigns" : "ui.loadError")}
                onRetry={campaignsError ? () => { void fetchCampaigns(); } : undefined} retryLabel={t("ui.retry")} />
            ) : campaigns.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="explore" size={36} color="#ddd" />
                <Text style={styles.emptyText}>
                  {t("details.campaignsEmpty")}
                </Text>
              </View>
            ) : (
              campaigns.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={c.name}
                  style={styles.campaignCard}
                  onPress={() => router.push(`/(app)/games/campaigns/${c.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.campaignCardHeader}>
                    <Text style={styles.campaignName}>{c.name}</Text>
                    <View style={[
                      styles.campaignStatusPill,
                      {
                        backgroundColor: c.status === "Active" ? COLORS.success + "20"
                          : c.status === "Completed" ? COLORS.primary + "20"
                            : "#f0f0f0"
                      }
                    ]}>
                      <Text style={[
                        styles.campaignStatusText,
                        {
                          color: c.status === "Active" ? COLORS.success
                            : c.status === "Completed" ? COLORS.primary
                              : COLORS.textMuted
                        }
                      ]}>
                        {c.status === "Active" ? t("details.campaignStatus.active")
                          : c.status === "Completed" ? t("details.campaignStatus.completed")
                            : t("details.campaignStatus.abandoned")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.campaignMeta}>
                    <Text style={styles.campaignMetaText}>
                      👥 {t("details.members", { count: c.memberCount })}
                    </Text>
                    <Text style={styles.campaignMetaText}>
                      🎲 {t("details.matches", { count: c.matchCount })}
                    </Text>
                    {c.averagePersonalRating && (
                      <Text style={styles.campaignMetaText}>
                        ⭐ {c.averagePersonalRating.toFixed(1)}
                      </Text>
                    )}
                  </View>

                  {c.notes && (
                    <Text style={styles.campaignNotes} numberOfLines={2}>
                      {c.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  pageHeader: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 16, paddingTop: 12 },
  content: { width: "100%", maxWidth: 680, alignSelf: "center" },

  // Hero
  heroImage: {
    width: "100%", height: 220,
    backgroundColor: COLORS.surface,
  },
  heroPlaceholder: { justifyContent: "center", alignItems: "center" },
  heroInfo: { padding: 16 },
  heroTitle: { ...UI_STYLES.title, marginBottom: 10 },

  // Ratings
  ratingsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  ratingChip: {
    backgroundColor: "#fff8e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffe082",
  },
  ratingChipPersonal: {
    backgroundColor: COLORS.primary + "0D",
    borderColor: COLORS.primary + "40",
  },
  ratingChipMeeple: {
    backgroundColor: COLORS.secondary + "0D",
    borderColor: COLORS.secondary + "40",
  },
  ratingChipLabel: { ...UI_STYLES.muted, fontWeight: "700", marginBottom: 2 },
  ratingChipValue: { ...UI_STYLES.body, fontWeight: "800", color: COLORS.secondary },

  // Meta chips
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: COLORS.surface,
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipText: { color: COLORS.onBackground, fontSize: 13, fontWeight: "600" },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tabBtn: { ...UI_STYLES.control, flex: 1, padding: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabText: { ...UI_STYLES.caption, fontWeight: "600", color: COLORS.textMuted, textAlign: "center" },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },

  tabContent: { padding: 16, gap: 16 },

  // Info tab
  sectionTitle: { ...UI_STYLES.section, marginBottom: 8 },
  description: { ...UI_STYLES.body, color: COLORS.onBackground },

  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { ...UI_STYLES.empty },

  // History tab — match cards
  matchCard: { ...UI_STYLES.card, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  matchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  matchDate: { ...UI_STYLES.muted, fontWeight: "600" },
  matchRating: {},
  matchRatingText: { fontSize: 14 },
  matchMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  matchTag: {
    backgroundColor: COLORS.primary + "14",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  matchTagText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.primary },
  matchMetaText: { ...UI_STYLES.caption, color: COLORS.textMuted },
  matchNotes: { ...UI_STYLES.body, color: COLORS.onBackground, fontStyle: "italic", marginTop: 4 },
  matchTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  matchTagChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  matchTagChipText: { ...UI_STYLES.caption, color: "#666", fontWeight: "600" },

  // Campaigns tab
  campaignCard: { ...UI_STYLES.card, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  campaignCardHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 8,
  },
  campaignName: { ...UI_STYLES.section, flex: 1, marginRight: 8 },
  campaignStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  campaignStatusText: { ...UI_STYLES.caption, fontWeight: "700" },
  campaignMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 6 },
  campaignMetaText: { ...UI_STYLES.caption, color: COLORS.textMuted, fontWeight: "600" },
  campaignNotes: { ...UI_STYLES.muted, fontStyle: "italic", marginTop: 4 },
});
