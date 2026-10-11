import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { ROUTES } from "@/src/constants/routes";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenScroll from "@/src/ui/Screen";
import { Avatar, Button, Card, Glyph, Hero, Row, Section } from "@/src/ui/components";
import { colors, space, strong, type } from "@/src/ui/theme";
import useStatistics from "@/src/features/statistics/hooks/useStatistics";
import { localISO, periodQuery } from "@/src/features/statistics/utils/period";
import { useFriends } from "@/src/features/friends/hooks/useFriends";
import { getIncomingRequests } from "@/src/features/friends/services/friendshipService";
import { usePendingJournal } from "@/src/features/games/matches/hooks/usePendingJournal";

// Perfil: who I am, my year, my friends (with requests) and my account.
export default function ProfileHomeScreen() {
  const { t, i18n } = useTranslation("navigation");
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [query] = useState(() => periodQuery("year", localISO(new Date()), Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"));
  const year = useStatistics(query);
  const { friends, error: friendsError, refetch } = useFriends();
  const { count: pendingRatings } = usePendingJournal();
  const [requests, setRequests] = useState<number | null>(null);
  const loadRequests = useCallback(() => { getIncomingRequests().then(list => setRequests(list.length)).catch(() => setRequests(null)); }, []);
  useEffect(loadRequests, [loadRequests]);
  useFocusEffect(useCallback(() => { loadRequests(); }, [loadRequests]));
  const n = (v: number) => new Intl.NumberFormat(i18n.language).format(v);
  const top = [...friends].sort((a, b) => b.sharedMatchesCount - a.sharedMatchesCount).slice(0, 3);
  const name = user?.userName ?? "";
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
    <ScreenScroll>
      <View>
        <ScreenHeader mode="root" title={t("me.title")} />
        <View style={styles.identity}>
          <Avatar name={name} size={64} />
          <View style={styles.flex}><Text style={type.title}>{name}</Text>{!!user?.email && <Text style={type.caption}>{user.email}</Text>}</View>
        </View>
      </View>

      <Hero>
        <View style={styles.yearHead}><Text style={[type.head, styles.flex]}>{t("me.year")}</Text><Text style={type.caption}>{t("me.yearToDate", { year: query.start.slice(0, 4) })}</Text></View>
        <View style={styles.numbers}>
          {[[year.data?.matches, "matches"], [year.data?.distinctGames, "games"], [year.data?.results.wins, "wins"]].map(([value, label]) =>
            <View key={label as string} style={styles.flex}><Text style={type.display}>{value == null ? "—" : n(value as number)}</Text><Text style={type.caption}>{t(`me.${label}`)}</Text></View>)}
        </View>
        <Button title={t("me.viewStatistics")} icon="chart-bar" style={styles.white} onPress={() => router.push(ROUTES.STATISTICS as never)} />
      </Hero>

      <Section title={t("me.friends")} note={t("me.friendsCount", { count: friends.length })}>
        <Card>
          {!!requests && <Row first inset={68} strongTitle title={t("me.requests", { count: requests })} subtitle={t("me.requestsHint")}
            lead={<View style={[styles.round, styles.gold]}><Glyph name="account-plus-outline" size={20} color={colors.pendingIcon} /></View>} onPress={() => router.push(ROUTES.FRIEND_REQUESTS as never)} />}
          {top.map((f, i) => <Row key={f.id} first={!requests && i === 0} inset={68} strongTitle title={f.userName} subtitle={t("me.sharedMatches", { count: f.sharedMatchesCount })}
            lead={<Avatar name={f.userName} />} onPress={() => router.push({ pathname: ROUTES.USER_PROFILE, params: { id: f.id } } as never)} />)}
          {friends.length === 0 && !friendsError && <Text style={[type.body, styles.message]}>{t("me.noFriends")}</Text>}
          {!!friendsError && <Row first title={t("me.loadError")} subtitle={t("me.retry")} end="none" onPress={() => refetch(true)} />}
          <Row first={!requests && top.length === 0 && !friendsError && friends.length > 0} title={t("me.allFriends")} tone="link" onPress={() => router.push(ROUTES.FRIENDS as never)} />
        </Card>
      </Section>

      <Section title={t("me.account")}>
        <Card>
          <Row first inset={52} lead={<Glyph name="cog-outline" size={22} color={colors.muted} />} title={t("settings")} subtitle={t("me.settingsHint")} onPress={() => router.push(ROUTES.SETTINGS as never)} />
          <Row inset={52} lead={<Glyph name="star-outline" size={22} color={colors.muted} />} title={t("me.pendingJournal")} value={pendingRatings ? n(pendingRatings) : undefined} onPress={() => router.push(ROUTES.PENDING_JOURNAL as never)} />
        </Card>
      </Section>
    </ScreenScroll>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, minWidth: 0 },
  identity: { flexDirection: "row", alignItems: "center", gap: space.lg, marginTop: space.sm },
  yearHead: { flexDirection: "row", alignItems: "baseline", gap: space.md },
  numbers: { flexDirection: "row", gap: space.md },
  white: { backgroundColor: colors.card },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  gold: { backgroundColor: colors.pendingSoft },
  message: { padding: space.lg, color: colors.muted },
});
