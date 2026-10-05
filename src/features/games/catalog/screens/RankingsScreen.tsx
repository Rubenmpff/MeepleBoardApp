/**
 * RankingsScreen.tsx
 *
 * Dois separadores:
 *   - Geral: nota média de TODOS os jogadores do MeepleBoard (MeepleBoardScore),
 *            comparada com o BGG ao lado.
 *   - Minha: só os jogos que TU avaliaste, ordenados pela média das TUAS
 *            próprias notas — não mistura com as avaliações de outros jogadores.
 */

import { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import gameService from "../services/gameService";
import { Game } from "../types/Game";
import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";

const PAGE_SIZE = 20;
type Tab = "geral" | "minha";

export default function RankingsScreen() {
  const { t } = useTranslation("games");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("geral");
  const [games, setGames] = useState<Game[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(async (page: number, append: boolean, activeTab: Tab) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const res = activeTab === "minha"
        ? await gameService.getMyRankings(page, PAGE_SIZE)
        : await gameService.getRankings(page, PAGE_SIZE, "meepleboard");
      setGames((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotalPages(res.totalPages || 1);
      setPageIndex(page);
    } catch (err) {
      console.error("Erro ao carregar rankings", err);
      if (!append) setGames([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPage(0, false, tab); }, [loadPage, tab]);

  const handleLoadMore = () => {
    if (loadingMore || pageIndex + 1 >= totalPages) return;
    loadPage(pageIndex + 1, true, tab);
  };

  const goToGame = (id: string) => {
    router.push({ pathname: ROUTES.GAME_DETAILS, params: { id } });
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.headerWrap}>
        <ScreenHeader
          mode="menu"
          title={t("rankings.title", { defaultValue: "Rankings de Jogos" })}
          subtitle={
            tab === "minha"
              ? t("rankings.subtitleMine", {
                  defaultValue: "Ordenado pelas tuas próprias avaliações",
                })
              : t("rankings.subtitle", {
                  defaultValue:
                    "Ordenado pela nota média da comunidade MeepleBoard",
                })
          }
        />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "geral" && styles.tabBtnActive]}
          onPress={() => setTab("geral")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === "geral" && styles.tabTextActive]}>
            {t("rankings.tabGeneral", { defaultValue: "Geral" })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "minha" && styles.tabBtnActive]}
          onPress={() => setTab("minha")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === "minha" && styles.tabTextActive]}>
            {t("rankings.tabMine", { defaultValue: "Minha" })}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={games}
        keyExtractor={(item, i) => item.id ?? String(i)}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="leaderboard" size={40} color="#ddd" />
            <Text style={styles.emptyText}>
              {tab === "minha"
                ? t("rankings.emptyMine", { defaultValue: "Ainda não avaliaste nenhum jogo. Avalia uma partida no diário!" })
                : t("rankings.empty", { defaultValue: "Ainda não há jogos avaliados. Sê o primeiro a avaliar uma partida no diário!" })}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.primary} />
          ) : null
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => goToGame(item.id)}
            activeOpacity={0.85}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{index + 1}</Text>
            </View>

            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <MaterialIcons name="sports-esports" size={20} color={COLORS.primary} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.chipsRow}>
                {tab === "minha" ? (
                  item.personalAverageRating != null && (
                    <View style={[styles.chip, styles.chipPersonal]}>
                      <Text style={[styles.chipText, { color: COLORS.primary }]}>
                        ⭐ {item.personalAverageRating.toFixed(1)}
                      </Text>
                    </View>
                  )
                ) : (
                  <>
                    {item.meepleBoardScore != null && (
                      <View style={[styles.chip, styles.chipMeeple]}>
                        <Text style={[styles.chipText, { color: COLORS.secondary }]}>
                          MB ⭐ {(item.meepleBoardScore / 10).toFixed(1)}
                        </Text>
                      </View>
                    )}
                    {item.averageRating != null && (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>BGG ⭐ {item.averageRating.toFixed(1)}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>

            <MaterialIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>
        )}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerWrap: { paddingHorizontal: 16, paddingTop: 8 },

  tabsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    marginHorizontal: 16, marginTop: 10,
    borderRadius: 10, padding: 4, gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "700", color: "#888" },
  tabTextActive: { color: "#fff" },

  listContent: { padding: 16, paddingTop: 12, flexGrow: 1 },

  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 10,
    marginBottom: 10, borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },

  rankBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.primary + "14",
    alignItems: "center", justifyContent: "center",
  },
  rankBadgeText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },

  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#f0f0f0" },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },

  gameName: { fontSize: 15, fontWeight: "700", color: COLORS.onBackground, marginBottom: 4 },
  chipsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: {
    backgroundColor: "#fff8e1", borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#ffe082",
  },
  chipMeeple: {
    backgroundColor: COLORS.secondary + "0D",
    borderColor: COLORS.secondary + "40",
  },
  chipPersonal: {
    backgroundColor: COLORS.primary + "0D",
    borderColor: COLORS.primary + "40",
  },
  chipText: { fontSize: 11, fontWeight: "700", color: "#f39c12" },

  emptyWrap: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { color: "#aaa", textAlign: "center", fontSize: 14, lineHeight: 20, paddingHorizontal: 30 },
});