/**
 * Matches waiting for my rating (route /(app)/games/pending-journal).
 * Reached from Início, Perfil and push notifications.
 */
import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import ScreenHeader from "@/src/ui/ScreenHeader";
import ScreenState from "@/src/ui/ScreenState";
import GameCover from "@/src/ui/GameCover";
import ScreenScroll from "@/src/ui/Screen";
import { Card, EmptyState, Note, Row } from "@/src/ui/components";
import { colors, space } from "@/src/ui/theme";
import { formatDate, formatDuration } from "@/src/ui/format";
import matchService from "@/src/features/games/matches/services/matchService";
import { MatchDto } from "@/src/features/games/matches/types/MatchForm";

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
      setMatches(await matchService.getPendingJournalMatches());
    } catch (err) {
      setLoadError(true);
      console.error("Erro ao carregar partidas pendentes", err);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const header = <View style={styles.header}><ScreenHeader title={t("ui.pendingTitle")} leftAccessibilityLabel={t("ui.back")} /></View>;
  if (loading) return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>{header}<ScreenState loading message={t("ui.loading")} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {header}
      <ScreenScroll contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[colors.primary]} tintColor={colors.primary} />}>
        {loadError ? <ScreenState error message={t("ui.pendingError")} onRetry={() => load()} retryLabel={t("ui.retry")} />
          : matches.length === 0 ? <EmptyState title={t("ui.emptyTitle")} message={t("ui.emptyBody")} />
          : <View style={styles.group}>
            <Note inset>{t("ui.pendingCount", { count: matches.length })}</Note>
            <Card>
              {matches.map((match, index) => {
                const meta = [match.isSoloGame ? t("modes.solo") : null, match.durationInMinutes ? formatDuration(match.durationInMinutes, i18n.language) : null, match.location || null].filter(Boolean).join(" · ");
                const players = (match.players ?? []).map(p => p.userName).filter(Boolean).join(", ");
                return <Row key={match.id} first={index === 0} inset={72} strongTitle title={match.gameName}
                  lead={<GameCover uri={match.gameImageUrl} size={44} />}
                  subtitle={[formatDate(match.matchDate, i18n.language), meta].filter(Boolean).join(" · ")}
                  detail={players ? <Text style={styles.players} numberOfLines={2}>{players}</Text> : undefined}
                  accessibilityLabel={t("ui.evaluate") + ": " + match.gameName}
                  onPress={() => router.push(`/(app)/games/matches/${match.id}/journal` as never)} />;
              })}
            </Card>
          </View>}
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg },
  content: { paddingTop: space.xs },
  group: { gap: space.sm },
  players: { fontSize: 13, lineHeight: 18, color: colors.muted },
});
