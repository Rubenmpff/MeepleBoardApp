import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import LottieView from "lottie-react-native";
import GameCover from "@/src/components/ui/GameCover";

import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import { useGameSessions } from "@/src/features/games/sessions/hooks/useGameSessions";
import { normalizeInviteStatus } from "@/src/features/games/sessions/types/GameSessionPlayer";
import { usePendingJournal } from "@/src/features/games/matches/hooks/usePendingJournal";
import AppHeader from "../components/AppHeader";
import PrimaryButton from "../components/PrimaryButton";
import SectionCard from "../components/SectionCard";
import DashboardAction from "../components/DashboardAction";
import { DASHBOARD_THEME as theme } from "../styles/dashboardTheme";
import { useLastMatch } from "../hooks/useLastMatch";

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.25;
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: lastMatch, loading: lastMatchLoading, error: lastMatchError, refetch } = useLastMatch();
  const { sessions } = useGameSessions();
  const { count: pendingJournalCount } = usePendingJournal();

  const activeSessions = sessions.filter((session) => session.status === "Active").length;
  const upcomingSessions = sessions.filter((session) => session.status === "Upcoming").length;
  const pendingInvites = sessions.filter((session) => {
    if (session.organizerId === user?.id) return false;
    const link = session.players?.find((player) => player.userId === user?.id);
    return link != null && normalizeInviteStatus(link.status) === "Pending";
  }).length;

  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? "greetings.morning" : hour < 19 ? "greetings.afternoon" : "greetings.evening");
  const sessionSummary = [
    activeSessions > 0 ? t("stats.activeSession", { count: activeSessions }) : null,
    upcomingSessions > 0 ? t("stats.upcomingSession", { count: upcomingSessions }) : null,
  ].filter(Boolean).join(" · ");
  const registerMatch = () => router.push(ROUTES.REGISTER_MATCH);

  return (
    // The tab bar already owns the bottom safe inset.
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.compactContent]}>
        <AppHeader username={user?.userName} greeting={greeting} compact={compact} />

        <PrimaryButton
          title={t("quickActions.registerMatch.title")}
          description={t("quickActions.registerMatch.description")}
          icon={<MaterialIcons name="add-circle-outline" size={30} color={theme.colors.onPrimary} />}
          onPress={registerMatch}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t("lastMatch.title")}</Text>
          <SectionCard>
            {lastMatchLoading ? (
              <View style={styles.loading} accessibilityLabel={t("lastMatch.loading")} accessibilityState={{ busy: true }}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.secondaryText}>{t("lastMatch.loading")}</Text>
              </View>
            ) : lastMatchError ? (
              <View style={styles.stack}>
                <Text style={styles.secondaryText} accessibilityRole="alert">{t("lastMatch.loadError")}</Text>
                <PrimaryButton title={t("lastMatch.retry")} variant="secondary" onPress={() => { void refetch(); }} />
              </View>
            ) : lastMatch ? (
              <View style={styles.stack}>
                <View style={[styles.matchRow, compact && styles.matchRowCompact]}>
                  <GameCover uri={lastMatch.imageUrl} style={styles.cover} />
                  <View style={[styles.matchContent, compact && styles.matchContentCompact]}>
                    <Text style={styles.matchName}>{lastMatch.name}</Text>
                    {(
                      <View style={styles.metadata}>
                        <MaterialIcons name="emoji-events" size={18} color={theme.colors.session} />
                        <Text style={styles.metadataText}>{lastMatch.result != null ? t(`matches:outcomes.${lastMatch.gameMode === "COOPERATIVE" ? `team${lastMatch.result}` : lastMatch.gameMode === "COMPETITIVE" && lastMatch.result === "Win" ? "winnersNamed" : lastMatch.result}`, { name: lastMatch.winnerNames?.join(", ") || t("matches:sessions.winnerNameUnavailable") }) : t(lastMatch.winner ? "matches:outcomes.legacyWinner" : "matches:outcomes.legacyUnknown", { name: lastMatch.winner })}</Text>
                      </View>
                    )}
                    <View style={styles.metadata}>
                      <MaterialIcons name="event" size={18} color={theme.colors.muted} />
                      <Text style={styles.metadataText}>{lastMatch.date}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.empty}>
                <LottieView source={require("@/assets/animations/ghost.json")} autoPlay loop style={styles.lottie} />
                <Text style={styles.emptyText}>{t("lastMatch.empty")}</Text>
              </View>
            )}
          </SectionCard>
        </View>

        {(pendingInvites > 0 || pendingJournalCount > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">{t("pending.title")}</Text>
            {pendingInvites > 0 && (
              <DashboardAction
                title={t("stats.pendingInvite", { count: pendingInvites })}
                description={t("pending.invitesDescription")}
                icon="mail-outline" color={theme.colors.session} background={theme.colors.sessionSoft}
                onPress={() => router.push(ROUTES.SESSIONS)}
              />
            )}
            {pendingJournalCount > 0 && (
              <DashboardAction
                title={t("pendingJournal.title", { count: pendingJournalCount })}
                description={t("pendingJournal.description")}
                icon="star-outline" color={theme.colors.journal} background={theme.colors.journalSoft}
                onPress={() => router.push(ROUTES.PENDING_JOURNAL)}
              />
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t("quickActions.title")}</Text>
          <DashboardAction
            title={t("quickActions.sessions.title")}
            description={sessionSummary || t("quickActions.sessions.description")}
            icon="event-note" color={theme.colors.session} background={theme.colors.sessionSoft}
            onPress={() => router.push(ROUTES.SESSIONS)}
          />
          <DashboardAction
            title={t("quickActions.library.title")} description={t("quickActions.library.description")}
            icon="collections-bookmark" color={theme.colors.library} background={theme.colors.librarySoft}
            onPress={() => router.push(ROUTES.LIBRARY)}
          />
          <DashboardAction
            title={t("quickActions.campaigns.title")} description={t("quickActions.campaigns.description")}
            icon="explore" color={theme.colors.campaign} background={theme.colors.campaignSoft}
            onPress={() => router.push(ROUTES.CAMPAIGNS)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: theme.space.lg,
    paddingTop: 0, paddingBottom: theme.space.xxl, gap: theme.space.lg,
  },
  compactContent: { paddingHorizontal: theme.space.md },
  section: { gap: theme.space.md },
  sectionTitle: { ...theme.text.section, color: theme.colors.text },
  stack: { gap: theme.space.lg },
  loading: { minHeight: 100, alignItems: "center", justifyContent: "center", gap: theme.space.md },
  secondaryText: { ...theme.text.body, color: theme.colors.muted },
  matchRow: { flexDirection: "row", alignItems: "flex-start", gap: theme.space.lg },
  matchRowCompact: { flexDirection: "column" },
  cover: { width: 72, height: 72, borderRadius: theme.radius.small },
  coverFallback: { backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" },
  matchContent: { flex: 1, minWidth: 0, gap: theme.space.sm },
  matchContentCompact: { flex: 0, width: "100%" },
  matchName: { ...theme.text.section, color: theme.colors.text },
  metadata: { flexDirection: "row", alignItems: "flex-start", gap: theme.space.sm },
  metadataText: { ...theme.text.body, color: theme.colors.muted, flex: 1 },
  empty: { gap: theme.space.lg },
  emptyText: { ...theme.text.body, color: theme.colors.muted, textAlign: "center" },
  lottie: { width: 72, height: 72, alignSelf: "center" },
});
