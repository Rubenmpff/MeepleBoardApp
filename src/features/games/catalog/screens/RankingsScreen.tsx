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
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Segmented } from "@/src/ui/components";
import { colors as ui } from "@/src/ui/theme";
import { formatRating } from "@/src/ui/format";
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
  const { t, i18n } = useTranslation("games");
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

      <View style={styles.segment}>
        <Segmented items={[{ key: "geral", label: t("rankings.tabGeneral", { defaultValue: "Geral" }) }, { key: "minha", label: t("rankings.tabMine", { defaultValue: "Minha" }) }]}
          value={tab} onChange={setTab} />
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
                <MaterialCommunityIcons name="dice-5" size={22} color={ui.icon} />
              </View>
            )}

            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={styles.gameName}>{item.name}</Text>
              <Text style={styles.ratings}>
                {tab === "minha"
                  ? item.personalAverageRating != null ? t("rankings.yourRating", { value: formatRating(item.personalAverageRating, i18n.language) }) : ""
                  : [item.meepleBoardScore != null ? t("listItem.meepleBoardRating", { value: formatRating(item.meepleBoardScore / 10, i18n.language) }) : null,
                    item.averageRating != null ? t("listItem.bggRating", { value: formatRating(item.averageRating, i18n.language) }) : null].filter(Boolean).join(" · ")}
              </Text>
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
  segment: { paddingHorizontal: 16, paddingTop: 4 },
  listContent: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  row: { ...UI_STYLES.card, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 16, minHeight: 72, marginBottom: 8 },
  rankBadge: { minWidth: 28, minHeight: 28, padding: 4, borderRadius: 14, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center" },
  rankBadgeText: { ...UI_STYLES.caption, fontWeight: "800", color: COLORS.primary },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: ui.hero },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  gameName: { ...UI_STYLES.body, fontWeight: "600", color: COLORS.onBackground },
  ratings: { ...UI_STYLES.caption, color: ui.muted },
  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 16 },
  emptyText: { ...UI_STYLES.empty, paddingHorizontal: 16 },
});
