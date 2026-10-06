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
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import ScreenState from "@/src/components/ui/ScreenState";
import { ROUTES } from "@/src/constants/routes";

const PAGE_SIZE = 20;
type Tab = "geral" | "minha";

export default function RankingsScreen() {
  const { t } = useTranslation("games");
  const router = useRouter();
  const { t: tn } = useTranslation("navigation");
  const { t: tc } = useTranslation("common");

  const [tab, setTab] = useState<Tab>("geral");
  const [games, setGames] = useState<Game[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failedPage, setFailedPage] = useState<number | null>(null);

  const loadPage = useCallback(async (page: number, append: boolean, activeTab: Tab) => {
    try {
      setFailedPage(null);
      if (append) setLoadingMore(true); else setLoading(true);
      const res = activeTab === "minha"
        ? await gameService.getMyRankings(page, PAGE_SIZE)
        : await gameService.getRankings(page, PAGE_SIZE, "meepleboard");
      setGames((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotalPages(res.totalPages || 1);
      setPageIndex(page);
    } catch (err) {
      console.error("Erro ao carregar rankings", err);
      setFailedPage(page);
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
          mode="back"
          appearance="refresh"
          leftAccessibilityLabel={tn("back")}
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
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "geral" }}
          onPress={() => setTab("geral")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === "geral" && styles.tabTextActive]}>
            {t("rankings.tabGeneral", { defaultValue: "Geral" })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "minha" && styles.tabBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "minha" }}
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
          <ScreenState loading message={tc("loading")} />
        </View>
      ) : failedPage === 0 ? (
        <View style={styles.center}>
          <ScreenState error message={t("rankings.loadError")} onRetry={() => loadPage(0, false, tab)} retryLabel={tc("retry")} />
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
            <MaterialIcons name="leaderboard" size={40} color={COLORS.primary} />
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
          ) : failedPage != null ? (
            <ScreenState error message={t("rankings.loadError")} onRetry={() => loadPage(failedPage, true, tab)} retryLabel={tc("retry")} />
          ) : null
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={item.name}
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

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.gameName}>{item.name}</Text>
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

            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
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
  tabsRow: { ...UI_STYLES.card, flexDirection: "row", marginHorizontal: 16, marginTop: 8, padding: 4, gap: 4 },
  tabBtn: { ...UI_STYLES.control, flex: 1, padding: 12, alignItems: "center" },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.textMuted, textAlign: "center" },
  tabTextActive: { color: COLORS.onPrimary },
  listContent: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  row: { ...UI_STYLES.card, flexDirection: "row", alignItems: "center", gap: 8, padding: 12, minHeight: 80, marginBottom: 12 },
  rankBadge: { minWidth: 28, minHeight: 28, padding: 4, borderRadius: 14, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center" },
  rankBadgeText: { ...UI_STYLES.caption, fontWeight: "800", color: COLORS.primary },
  thumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primarySoft },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  gameName: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.onBackground, marginBottom: 4 },
  chipsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: { backgroundColor: COLORS.sessionSoft, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  chipMeeple: { backgroundColor: COLORS.sessionSoft },
  chipPersonal: { backgroundColor: COLORS.primarySoft },
  chipText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.session },
  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 16 },
  emptyText: { ...UI_STYLES.empty, paddingHorizontal: 16 },
});
