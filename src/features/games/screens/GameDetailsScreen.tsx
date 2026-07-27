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
  View, Text, ActivityIndicator, ScrollView,
  Image, StyleSheet, TouchableOpacity, Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import gameService from "../services/gameService";
import matchService from "../services/matchService";
import campaignService from "../services/campaignService";
import { Game } from "../types/Game";
import { MatchDto } from "../types/MatchForm";
import { Campaign } from "../types/Campaign";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";

type Tab = "info" | "history" | "campaigns";

export default function GameDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [game, setGame] = useState<Game | null>(null);
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("info");

  const fetchGame = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await gameService.getById(id);
      setGame(data);
    } catch (err) {
      console.error("Erro ao carregar jogo", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchHistory = useCallback(async () => {
    if (!id || !currentUser?.id) return;
    try {
      const [historyRes, ratingRes] = await Promise.all([
        matchService.getHistoryByGame(id),
        matchService.getUserRatingForGame(id),
      ]);
      setMatches(historyRes);
      setUserRating(ratingRes);
    } catch (err) {
      console.error("Erro ao carregar histórico", err);
    }
  }, [id, currentUser?.id]);

  const fetchCampaigns = useCallback(async () => {
    if (!id) return;
    try {
      const data = await campaignService.getByGame(id);
      setCampaigns(data);
    } catch (err) {
      console.error("Erro ao carregar campanhas", err);
    }
  }, [id]);

  useEffect(() => { fetchGame(); }, [fetchGame]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
    if (tab === "campaigns") fetchCampaigns();
  }, [tab]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Jogo não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ── Hero ── */}
      <ScrollView style={styles.screen} stickyHeaderIndices={[1]}>
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
            <Text style={styles.heroTitle}>{game.name}</Text>

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
              {userRating !== null && (
                <View style={[styles.ratingChip, styles.ratingChipPersonal]}>
                  <Text style={[styles.ratingChipLabel, { color: COLORS.primary }]}>Tua</Text>
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
                  <Text style={[styles.chipText, { color: COLORS.secondary }]}>Coop</Text>
                </View>
              )}
              {game.supportsSoloMode && (
                <View style={[styles.chip, { backgroundColor: COLORS.success + "20" }]}>
                  <Text style={[styles.chipText, { color: COLORS.success }]}>Solo</Text>
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
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "info" ? "Info"
                  : t === "history" ? `Histórico${matches.length > 0 ? ` (${matches.length})` : ""}`
                  : `Campanhas${campaigns.length > 0 ? ` (${campaigns.length})` : ""}`}
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
                <Text style={styles.sectionTitle}>Descrição</Text>
                <Text style={styles.description}>{game.description}</Text>
              </>
            ) : (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="info-outline" size={36} color="#ddd" />
                <Text style={styles.emptyText}>
                  Sem descrição disponível.{"\n"}
                  Importa o jogo do BGG para ver mais detalhes.
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
            {matches.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="history" size={36} color="#ddd" />
                <Text style={styles.emptyText}>
                  Ainda não registaste nenhuma partida deste jogo.
                </Text>
              </View>
            ) : (
              matches.map((m, i) => (
                <View key={m.id ?? i} style={styles.matchCard}>
                  {/* Header */}
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchDate}>
                      {new Date(m.matchDate).toLocaleDateString("pt-PT", {
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
                        <Text style={styles.matchTagText}>Solo</Text>
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
            <TouchableOpacity
              style={styles.createCampaignBtn}
              onPress={() => router.push(`/(app)/games/campaigns/create?gameId=${id}&gameName=${encodeURIComponent(game.name)}`)}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.createCampaignBtnText}>Nova Campanha</Text>
            </TouchableOpacity>

            {campaigns.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="explore" size={36} color="#ddd" />
                <Text style={styles.emptyText}>
                  Ainda não tens campanhas deste jogo.{"\n"}
                  Cria uma para acompanhar a tua aventura!
                </Text>
              </View>
            ) : (
              campaigns.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.campaignCard}
                  onPress={() => router.push(`/(app)/games/campaigns/${c.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.campaignCardHeader}>
                    <Text style={styles.campaignName} numberOfLines={1}>{c.name}</Text>
                    <View style={[
                      styles.campaignStatusPill,
                      { backgroundColor: c.status === "Active" ? COLORS.success + "20"
                          : c.status === "Completed" ? COLORS.primary + "20"
                          : "#f0f0f0" }
                    ]}>
                      <Text style={[
                        styles.campaignStatusText,
                        { color: c.status === "Active" ? COLORS.success
                            : c.status === "Completed" ? COLORS.primary
                            : "#999" }
                      ]}>
                        {c.status === "Active" ? "Ativa"
                          : c.status === "Completed" ? "Concluída"
                          : "Abandonada"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.campaignMeta}>
                    <Text style={styles.campaignMetaText}>
                      👥 {c.memberCount} membros
                    </Text>
                    <Text style={styles.campaignMetaText}>
                      🎲 {c.matchCount} partidas
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
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { color: COLORS.error, fontSize: 16, textAlign: "center" },

  // Hero
  heroImage: {
    width: "100%", height: 220,
    backgroundColor: COLORS.surface,
  },
  heroPlaceholder: { justifyContent: "center", alignItems: "center" },
  heroInfo: { padding: 16 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: COLORS.primary, marginBottom: 10 },

  // Ratings
  ratingsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  ratingChip: {
    backgroundColor: "#fff8e1", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1, borderColor: "#ffe082",
  },
  ratingChipPersonal: {
    backgroundColor: COLORS.primary + "0D",
    borderColor: COLORS.primary + "40",
  },
  ratingChipLabel: { fontSize: 10, fontWeight: "700", color: "#888", marginBottom: 2 },
  ratingChipValue: { fontSize: 15, fontWeight: "800", color: "#f39c12" },

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
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: "#aaa" },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },

  tabContent: { padding: 16 },

  // Info tab
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.onBackground, marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, color: COLORS.onBackground },

  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { color: "#aaa", textAlign: "center", fontSize: 14, lineHeight: 20 },

  // History tab — match cards
  matchCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  matchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  matchDate: { fontSize: 13, fontWeight: "600", color: "#888" },
  matchRating: {},
  matchRatingText: { fontSize: 14 },
  matchMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  matchTag: {
    backgroundColor: COLORS.primary + "14",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  matchTagText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  matchMetaText: { fontSize: 12, color: "#777" },
  matchNotes: {
    fontSize: 13, color: COLORS.onBackground, lineHeight: 18,
    fontStyle: "italic", marginTop: 4,
  },
  matchTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  matchTagChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  matchTagChipText: { fontSize: 11, color: "#666", fontWeight: "600" },

  // Campaigns tab
  createCampaignBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: COLORS.primary,
    paddingVertical: 12, borderRadius: 12, marginBottom: 16,
  },
  createCampaignBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  campaignCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  campaignCardHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 8,
  },
  campaignName: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground, flex: 1, marginRight: 8 },
  campaignStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  campaignStatusText: { fontSize: 11, fontWeight: "700" },
  campaignMeta: { flexDirection: "row", gap: 12, marginBottom: 6 },
  campaignMetaText: { fontSize: 12, color: "#777", fontWeight: "600" },
  campaignNotes: { fontSize: 13, color: "#888", fontStyle: "italic", marginTop: 4 },
});