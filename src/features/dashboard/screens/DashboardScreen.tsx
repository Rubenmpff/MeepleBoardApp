import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import LottieView from "lottie-react-native";
import GameCover from "@/src/components/ui/GameCover";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenScroll from "@/src/ui/Screen";
import { Button, Card, Glyph, Hero, Icon, Row, Section } from "@/src/ui/components";
import { colors, isLarge, space, type } from "@/src/ui/theme";
import { formatDate, formatDateTime, locale } from "@/src/ui/format";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import { useGameSessions } from "@/src/features/games/sessions/hooks/useGameSessions";
import { GameSession } from "@/src/features/games/sessions/types/GameSession";
import { normalizeInviteStatus } from "@/src/features/games/sessions/types/GameSessionPlayer";
import { usePendingJournal } from "@/src/features/games/matches/hooks/usePendingJournal";
import { getIncomingRequests } from "@/src/features/friends/services/friendshipService";
import useStatistics from "@/src/features/statistics/hooks/useStatistics";
import { localISO, periodQuery } from "@/src/features/statistics/utils/period";
import { Summary } from "@/src/features/statistics/types";
import { useLastMatch } from "../hooks/useLastMatch";

const SHOWN_INVITES = 3;
const SHOWN_UPCOMING = 2;

// Início answers "what do I do now?": the session happening now, what waits for me,
// what is coming up, then the last match and the year so far. Creating things lives in ＋.
export default function DashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("dashboard");
  const language = i18n?.language ?? "pt";
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: lastMatch, loading: lastMatchLoading, error: lastMatchError, refetch: refetchLastMatch } = useLastMatch();
  const { sessions, fetchSessions } = useGameSessions();
  const { count: pendingRatings, refetch: refetchRatings } = usePendingJournal();
  const [query] = useState(() => periodQuery("year", localISO(new Date()), Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"));
  const year = useStatistics(query);
  // Keep the last numbers on screen while a refresh reloads them.
  const lastYear = useRef<Summary | null>(null);
  if (year.data) lastYear.current = year.data;
  const yearData = year.data ?? lastYear.current;
  const [requests, setRequests] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(() => getIncomingRequests().then(list => setRequests(list.length)).catch(() => setRequests(0)), []);
  useEffect(() => { void loadRequests(); }, [loadRequests]);

  // useStatistics returns a new refetch each render; a ref keeps refresh stable for useFocusEffect.
  const refetchYear = useRef(year.refetch);
  refetchYear.current = year.refetch;
  const refresh = useCallback(async () => {
    refetchYear.current();
    await Promise.all([fetchSessions(), refetchRatings(), refetchLastMatch(true), loadRequests()]);
  }, [fetchSessions, refetchRatings, refetchLastMatch, loadRequests]);
  // The hooks load on mount; later focuses (back from registering, answering an invite…) refresh silently.
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    if (focused.current) void refresh();
    focused.current = true;
  }, [refresh]));

  const mine = (session: GameSession) => {
    if (session.organizerId === user?.id) return true;
    const link = session.players?.find(player => player.userId === user?.id);
    return link != null && normalizeInviteStatus(link.status) === "Accepted";
  };
  const active = sessions.filter(session => session.status === "Active" && mine(session))
    .sort((a, b) => time(b.startDate) - time(a.startDate))[0];
  const invites = sessions.filter(session => {
    if (session.status === "Cancelled" || session.status === "Closed" || session.organizerId === user?.id) return false;
    const link = session.players?.find(player => player.userId === user?.id);
    return link != null && normalizeInviteStatus(link.status) === "Pending";
  });
  // Overdue sessions still marked Upcoming stay in Jogar → Agendadas; here "próximas" means from today on (or undated).
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const upcoming = sessions.filter(session => session.status === "Upcoming" && mine(session) && (!session.scheduledStartDate || time(session.scheduledStartDate) >= startOfToday))
    .sort((a, b) => (time(a.scheduledStartDate) || Infinity) - (time(b.scheduledStartDate) || Infinity));
  const hasTodo = invites.length > 0 || pendingRatings > 0 || requests > 0;

  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? "greetings.morning" : hour < 19 ? "greetings.afternoon" : "greetings.evening");
  const today = new Intl.DateTimeFormat(locale(language), { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const n = (value: number) => new Intl.NumberFormat(locale(language)).format(value);
  const openSession = (id: string) => router.push({ pathname: ROUTES.SESSION_DETAIL, params: { id } } as never);
  // "desde as 09:49" today; a session left open from an earlier day shows its date.
  const since = (start: string) => new Date(start).toDateString() === new Date().toDateString()
    ? t("now.sinceToday", { time: timeOf(start, language) }) : t("now.since", { date: formatDateTime(start, language) });
  const when = (session: GameSession) => session.scheduledStartDate ? formatDateTime(session.scheduledStartDate, language) : t("upcoming.noDate");

  return (
    // The tab bar already owns the bottom safe inset.
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScreenScroll refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} tintColor={colors.primary}
        onRefresh={() => { setRefreshing(true); void refresh().finally(() => setRefreshing(false)); }} />}>
        <ScreenHeader mode="root" title={`${greeting}, ${user?.userName?.trim() || t("player")}`} subtitle={capitalize(today)} />

        {active ? (
          <Hero>
            <View style={styles.nowHead}>
              <View style={styles.nowPill}><Glyph name="play" size={14} color={colors.onPrimary} /><Text style={styles.nowPillText}>{t("now.label")}</Text></View>
              {!!active.startDate && <Text style={type.caption}>{since(active.startDate)}</Text>}
            </View>
            <Text style={type.title}>{active.name}</Text>
            <Text style={type.caption}>{[
              t("now.confirmed", { count: active.players?.filter(p => normalizeInviteStatus(p.status) === "Accepted").length ?? 0 }),
              active.matches?.length ? t("now.matches", { count: active.matches.length }) : null,
              active.location || null,
            ].filter(Boolean).join(" · ")}</Text>
            <View style={[styles.buttons, large && styles.buttonsLarge]}>
              <Button variant="primary" icon="plus" title={t("now.registerHere")} style={!large && styles.flex}
                onPress={() => router.push({ pathname: "/games/sessions/register", params: { sessionId: active.id } } as never)} />
              <Button title={t("now.open")} accessibilityLabel={t("now.openAccessibility", { name: active.name })} style={styles.white} onPress={() => openSession(active.id)} />
            </View>
          </Hero>
        ) : (
          <Button variant="primary" icon="plus" title={t("register.title")} accessibilityLabel={t("register.title")} onPress={() => router.push(ROUTES.REGISTER_MATCH)} />
        )}

        {hasTodo && (
          <Section title={t("todo.title")}>
            <Card>
              {invites.slice(0, SHOWN_INVITES).map((session, index) => (
                <Row key={session.id} first={index === 0} inset={68} strongTitle lead={<Badge icon="email-outline" />}
                  title={t("todo.invite", { name: session.name })} subtitle={[t("todo.from", { name: session.organizerUserName }), when(session)].join(" · ")}
                  onPress={() => openSession(session.id)} />
              ))}
              {invites.length > SHOWN_INVITES && (
                <Row inset={68} title={t("todo.allInvites", { count: invites.length })} tone="link" onPress={() => router.push(ROUTES.SESSIONS)} />
              )}
              {pendingRatings > 0 && (
                <Row first={invites.length === 0} inset={68} strongTitle lead={<Badge icon="star-outline" />}
                  title={t("todo.ratings", { count: pendingRatings })} subtitle={t("todo.ratingsHint")} onPress={() => router.push(ROUTES.PENDING_JOURNAL)} />
              )}
              {requests > 0 && (
                <Row first={invites.length === 0 && pendingRatings === 0} inset={68} strongTitle lead={<Badge icon="account-plus-outline" />}
                  title={t("todo.requests", { count: requests })} subtitle={t("todo.requestsHint")} onPress={() => router.push(ROUTES.FRIEND_REQUESTS as never)} />
              )}
            </Card>
          </Section>
        )}

        {(upcoming.length > 0 || !active) && (
          <Section title={t("upcoming.title")} note={upcoming.length > SHOWN_UPCOMING ? String(upcoming.length) : undefined}>
            <Card>
              {upcoming.slice(0, SHOWN_UPCOMING).map((session, index) => (
                <Row key={session.id} first={index === 0} strongTitle title={session.name}
                  subtitle={[when(session), session.location || null].filter(Boolean).join(" · ")} onPress={() => openSession(session.id)} />
              ))}
              {upcoming.length > SHOWN_UPCOMING && (
                <Row title={t("upcoming.all")} tone="link" onPress={() => router.push(ROUTES.SESSIONS)} />
              )}
              {upcoming.length === 0 && (
                <Row first title={t("upcoming.create")} subtitle={t("upcoming.createHint")} tone="link" onPress={() => router.push(ROUTES.SESSION_CREATE)} />
              )}
            </Card>
          </Section>
        )}

        <Section title={t("lastMatch.title")}>
          <Card>
            {lastMatchLoading ? (
              <View style={styles.message} accessibilityLabel={t("lastMatch.loading")} accessibilityState={{ busy: true }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[type.body, styles.muted]}>{t("lastMatch.loading")}</Text>
              </View>
            ) : lastMatchError ? (
              <View style={styles.message}>
                <Text style={[type.body, styles.muted]} accessibilityRole="alert">{t("lastMatch.loadError")}</Text>
                <Button title={t("lastMatch.retry")} onPress={() => { void refetchLastMatch(); }} />
              </View>
            ) : lastMatch ? (
              <>
                <Row first inset={76} strongTitle title={lastMatch.name} lead={<GameCover uri={lastMatch.imageUrl} size={48} />}
                  subtitle={[outcome(lastMatch, t), displayDate(lastMatch.date, language)].join(" · ")} />
                <Row title={t("lastMatch.all")} tone="link" onPress={() => router.push({ pathname: ROUTES.PLAY, params: { area: "matches" } } as never)} />
              </>
            ) : (
              <View style={styles.message}>
                <LottieView source={require("@/assets/animations/ghost.json")} autoPlay loop style={styles.lottie} />
                <Text style={[type.body, styles.muted, styles.center]}>{t("lastMatch.empty")}</Text>
              </View>
            )}
          </Card>
        </Section>

        <Section title={t("year.title")} note={t("year.note", { year: query.start.slice(0, 4) })}>
          <Card>
            <View style={[styles.numbers, large && styles.numbersLarge]}>
              {([["matches", yearData?.matches], ["games", yearData?.distinctGames], ["wins", yearData?.results.wins]] as const).map(([key, value]) => (
                <View key={key} style={styles.flex} accessible accessibilityLabel={`${t(`year.${key}`)}: ${value == null ? "—" : n(value)}`}>
                  <Text style={type.caption}>{t(`year.${key}`)}</Text>
                  <Text style={type.title}>{value == null ? "—" : n(value)}</Text>
                </View>
              ))}
            </View>
            <Row title={t("year.statistics")} tone="link" onPress={() => router.push(ROUTES.STATISTICS as never)} />
          </Card>
        </Section>
      </ScreenScroll>
    </SafeAreaView>
  );
}

// Gold marks something waiting for me.
function Badge({ icon }: { icon: Icon }) {
  return <View style={styles.badge}><Glyph name={icon} size={20} color={colors.pendingIcon} /></View>;
}

const time = (value?: string | null) => (value ? new Date(value).getTime() || 0 : 0);
const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1);
const timeOf = (value: string, language: string) => new Intl.DateTimeFormat(locale(language), { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function outcome(match: NonNullable<ReturnType<typeof useLastMatch>["data"]>, t: (key: string, options?: Record<string, unknown>) => string) {
  if (match.result == null) return t(match.winner ? "matches:outcomes.legacyWinner" : "matches:outcomes.legacyUnknown", { name: match.winner });
  const key = match.gameMode === "COOPERATIVE" ? `team${match.result}` : match.gameMode === "COMPETITIVE" && match.result === "Win" ? "winnersNamed" : match.result;
  return t(`matches:outcomes.${key}`, { name: match.winnerNames?.join(", ") || t("matches:sessions.winnerNameUnavailable") });
}

// The API sends ISO dates ("2026-10-07"); anything else is shown as received.
function displayDate(value: string, language: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? formatDate(value.slice(0, 10) + "T12:00:00", language) : value;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  muted: { color: colors.muted },
  white: { backgroundColor: colors.card },
  nowHead: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm },
  nowPill: { flexDirection: "row", alignItems: "center", gap: space.xs, backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: space.sm, paddingVertical: 2 },
  nowPillText: { ...type.micro, color: colors.onPrimary, fontWeight: "600" },
  buttons: { flexDirection: "row", gap: space.sm },
  buttonsLarge: { flexDirection: "column" },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.pendingSoft },
  message: { padding: space.lg, gap: space.md, alignItems: "center" },
  lottie: { width: 72, height: 72 },
  numbers: { flexDirection: "row", gap: space.md, padding: space.lg },
  numbersLarge: { flexWrap: "wrap" },
});
