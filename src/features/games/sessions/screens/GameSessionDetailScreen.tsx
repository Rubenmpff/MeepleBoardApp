/**
 * GameSessionDetailScreen.tsx
 *
 * Detalhe de uma sessão de jogo.
 * - Organizer: pode cancelar (Upcoming) ou encerrar (Active)
 * - Convidado: pode aceitar/recusar convite (Pending)
 * - Lista de participantes com status
 * - Registo de partidas numa página própria, apenas para participantes aceites
 * - Lista de partidas da sessão
 */
import { SESSION_STATUS_COLORS } from "@/src/styles/statusColors";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import { View, Text, RefreshControl, StyleSheet, Alert, ScrollView, } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GameCover from "@/src/components/ui/GameCover";
import { Avatar, Card, Note, Row, Section } from "@/src/ui/components";
import { colors, space, strong, type } from "@/src/ui/theme";
import { formatDateTime } from "@/src/ui/format";
import { matchResultText } from "../utils/matchResultKey";
import { useSelector } from "react-redux";
import sessionService from "@/src/features/games/sessions/services/sessionService";
import { GameSession } from "@/src/features/games/sessions/types/GameSession";
import { normalizeInviteStatus } from "@/src/features/games/sessions/types/GameSessionPlayer";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { RootState } from "@/src/store/store";
import SessionAttendance from "../components/SessionAttendance";
import SessionInvitations from "../components/SessionInvitations";
export default function GameSessionDetailScreen() {
  const { t, i18n } = useTranslation("matches");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const fetchSession = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return;
    try {
      setLoadError(false);
      if (!opts?.silent) setLoading(true);
      const data = await sessionService.getById(id);
      setSession(data);
    } catch {
      setLoadError(true);
      Alert.alert(t("sessions.error"), t("sessions.loadError"));
    } finally {
      if (!opts?.silent) setLoading(false);
      setRefreshing(false);
    }
  }, [id]);
  useFocusEffect(useCallback(() => { void fetchSession(); }, [fetchSession]));
  /* ── Derived ── */
  const isOrganizer = session?.organizerId === currentUser?.id;
  const isActive    = session?.status === "Active";
  const isUpcoming  = session?.status === "Upcoming";
  const myLink = useMemo(() =>
    session?.players?.find((p) => p.userId === currentUser?.id),
    [session, currentUser?.id]
  );
  const myStatus  = myLink ? normalizeInviteStatus(myLink.status) : null;
  const isPending = myStatus === "Pending" && !isOrganizer;
  const scheduledLabel = session?.scheduledStartDate ? formatDateTime(session.scheduledStartDate, i18n.language) : null;
  const deadlineLabel = session?.effectiveDeadline ? formatDateTime(session.effectiveDeadline, i18n.language) : null;
  const matches = useMemo(() => session?.matches ?? [], [session]);
  /* ── Actions ── */
  const handleRespondInvite = async (accept: boolean) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await sessionService.respondInvite(id, accept);
      await fetchSession({ silent: true });
      Alert.alert(
        accept ? t("sessions.inviteAccepted") : t("sessions.inviteDeclined"),
        accept ? t("sessions.participating") : t("sessions.organizerNotified")
      );
    } catch (err: any) {
      Alert.alert(t("sessions.error"), err?.message ?? t("sessions.respondError"));
    } finally {
      setActionLoading(false);
    }
  };
  const handleCancel = () => {
    Alert.alert(
      t("sessions.cancelTitle"),
      t("sessions.cancelConfirm"),
      [
        { text: t("sessions.no"), style: "cancel" },
        {
          text: t("sessions.yesCancel"), style: "destructive",
          onPress: async () => {
            if (!id) return;
            setActionLoading(true);
            try {
              await sessionService.cancel(id);
              Alert.alert(t("sessions.cancelledTitle"), t("sessions.cancelled"), [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert(t("sessions.error"), err?.message ?? t("sessions.cancelError"));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };
  const handleClose = () => {
    Alert.alert(
      t("sessions.closeTitle"),
      t("sessions.closeConfirm"),
      [
        { text: t("sessions.no"), style: "cancel" },
        {
          text: t("sessions.yesClose"), style: "destructive",
          onPress: async () => {
            if (!id) return;
            setActionLoading(true);
            try {
              await sessionService.close(id);
              await fetchSession({ silent: true });
            } catch (err: any) {
              Alert.alert(t("sessions.error"), err?.message ?? t("sessions.closeError"));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };
  if (loading) return <ScreenLayout title={t("sessions.details")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;
  if (!session || loadError) return <ScreenLayout title={t("sessions.details")}><ScreenState error={loadError} message={t(loadError ? "sessions.loadError" : "sessions.notFound")} onRetry={() => fetchSession()} retryLabel={t("ui.retry")} /></ScreenLayout>;
  const tone = SESSION_STATUS_COLORS[session.status];
  const statusOf = (raw: Parameters<typeof normalizeInviteStatus>[0]) => normalizeInviteStatus(raw);
  return (
    <ScreenLayout title={t("sessions.details")}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={COLORS.primary} onRefresh={() => { setRefreshing(true); void fetchSession({ silent: true }); }} />}>
        <View style={styles.summary}>
          <View style={styles.statusRow}>
            <Text style={[styles.pill, { color: tone, backgroundColor: tone + "1F" }]}>{t("sessions.status." + session.status)}</Text>
            <Text style={type.caption}>{isOrganizer ? t("sessions.youOrganize") : t("sessions.organizer", { name: session.organizerUserName })}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">{session.name}</Text>
          {!!scheduledLabel && <InfoRow icon="clock-outline" text={scheduledLabel} />}
          {!!session.location && <InfoRow icon="map-marker-outline" text={session.location} />}
          <SessionAttendance players={session.players ?? []} compact />
          {!!deadlineLabel && isUpcoming && <InfoRow icon="timer-sand" text={t(session.responseDeadline ? "sessions.replyBy" : "sessions.replyByStart", { date: deadlineLabel })} />}
        </View>

        {isPending && <View style={styles.invite}>
          <Text style={[type.body, strong, { color: colors.pendingText }]}>{t("sessions.inviteQuestion")}</Text>
          <View style={styles.actions}>
            <View style={styles.flex}><PrimaryButton title={t("sessions.accept")} loading={actionLoading} onPress={() => handleRespondInvite(true)} /></View>
            <View style={styles.flex}><PrimaryButton title={t("sessions.decline")} variant="secondary" disabled={actionLoading} onPress={() => handleRespondInvite(false)} /></View>
          </View>
        </View>}
        {isActive && myStatus === "Accepted" && <PrimaryButton title={t("sessions.registerMatchHere")} icon={<MaterialCommunityIcons name="plus" size={20} color={COLORS.onPrimary} />}
          disabled={actionLoading} onPress={() => router.push({ pathname: "/games/sessions/register", params: { sessionId: session.id } })} />}
        {isUpcoming && <Note inset>{t("sessions.upcomingHint")}</Note>}

        <Section title={t("sessions.who")} note={String(session.players?.length ?? 0)}>
          <Card>
            {session.players?.map((p, index) => {
              const status = statusOf(p.status);
              return <Row key={p.userId} first={index === 0} inset={68} strongTitle lead={<Avatar name={p.userName || "?"} />}
                title={p.userName || t("sessions.playerNameUnavailable")} subtitle={p.isOrganizer ? t("sessions.organizerRole") : undefined}
                detail={<Text style={[styles.pill, styles.pillStart, status === "Accepted" ? styles.accepted : status === "Declined" ? styles.declined : styles.pending]}>
                  {t(status === "Accepted" ? "sessions.accepted" : status === "Declined" ? "sessions.declined" : "sessions.pending")}</Text>} />;
            })}
          </Card>
          {isOrganizer && isUpcoming && <SessionInvitations session={session} />}
        </Section>

        <Section title={t("sessions.matchesHeading")} note={String(matches.length)}>
          {matches.length === 0 ? <Card padded><Text style={[type.body, { color: colors.muted }]}>{t("sessions.noMatches")}</Text></Card> : <Card>
            {matches.map((m, index) => <Row key={m.id} first={index === 0} inset={72} strongTitle title={m.gameName}
              lead={<GameCover uri={m.gameImageUrl} size={44} />}
              subtitle={[matchTime(m.matchDate, i18n.language), matchResultText(m, t)].filter(Boolean).join(" · ")}
              detail={m.players?.length ? <Text style={[type.caption, styles.scores]}>{m.players.map(p =>
                (p.userName?.trim() || t("sessions.playerNameUnavailable")) + ": " + (p.score == null ? t("sessions.scoreUndefined") : String(p.score))).join(" · ")}</Text> : undefined}
              accessibilityLabel={t("success.viewMatch") + ": " + m.gameName}
              onPress={() => router.push({ pathname: "/games/matches/[id]", params: { id: m.id, originSessionId: session.id } })} />)}
          </Card>}
        </Section>

        {isOrganizer && (isActive || isUpcoming) && <Section title={t("sessions.manage")}>
          <Card>
            {isActive && <Row first title={t("sessions.closeTitle")} tone="danger" end="none" onPress={handleClose} accessibilityLabel={t("sessions.closeTitle")} />}
            {isUpcoming && <Row first title={t("sessions.cancelTitle")} tone="danger" end="none" onPress={handleCancel} accessibilityLabel={t("sessions.cancelTitle")} />}
          </Card>
          <Note inset>{t("sessions.manageHint")}</Note>
        </Section>}
      </ScrollView>
    </ScreenLayout>
  );
}
function matchTime(value: string | undefined, language: string) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(language, { hour: "2-digit", minute: "2-digit" }).format(date) : null;
}
function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; text: string }) {
  return <View style={styles.infoRow}><MaterialCommunityIcons name={icon} size={18} color={COLORS.textMuted} /><Text style={[type.body, styles.flex]}>{text}</Text></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: space.lg, paddingBottom: 32, gap: space.xl },
  flex: { flex: 1, minWidth: 0 },
  summary: { gap: space.sm },
  statusRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: COLORS.onBackground },
  infoRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  scores: { marginTop: 2 },
  pill: { fontSize: 12, lineHeight: 18, fontWeight: "600", paddingHorizontal: 9, paddingVertical: 1, borderRadius: 999, overflow: "hidden" },
  pillStart: { alignSelf: "flex-start", marginTop: 2 },
  accepted: { color: colors.primary, backgroundColor: colors.primarySoft },
  declined: { color: colors.danger, backgroundColor: colors.dangerSoft },
  pending: { color: colors.pendingText, backgroundColor: colors.pendingSoft },
  invite: { gap: space.md, padding: space.lg, borderRadius: 14, backgroundColor: colors.pendingSoft },
  actions: { flexDirection: "row", gap: space.md },
});
