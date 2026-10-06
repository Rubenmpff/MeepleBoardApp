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
import { View, Text, RefreshControl, StyleSheet, Alert, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import sessionService from "@/src/features/games/sessions/services/sessionService";
import { GameSession } from "@/src/features/games/sessions/types/GameSession";
import { normalizeInviteStatus } from "@/src/features/games/sessions/types/GameSessionPlayer";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import MatchSummary from "../../matches/components/MatchSummary";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { RootState } from "@/src/store/store";
import SessionAttendance from "../components/SessionAttendance";
import SessionInvitations from "../components/SessionInvitations";
export default function GameSessionDetailScreen() {
  const { t, i18n } = useTranslation("matches");
  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";
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
  const scheduledLabel = session?.scheduledStartDate
    ? new Date(session.scheduledStartDate).toLocaleString(locale, {
        weekday: "long", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit",
      })
    : null;
  const deadlineLabel = session?.effectiveDeadline
    ? new Date(session.effectiveDeadline).toLocaleString(locale, {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : null;
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
  return (
    <ScreenLayout title={t("sessions.details")}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchSession({ silent: true }); }} />}>
        <View style={styles.summary}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{session.name}</Text>
            <Text style={[styles.statusText, { color: SESSION_STATUS_COLORS[session.status] }]}>{t("sessions.status." + session.status)}</Text>
          </View>
          {!!scheduledLabel && <InfoRow icon="schedule" text={scheduledLabel} />}
          {!!session.location && <InfoRow icon="place" text={session.location} />}
          <InfoRow icon="person" text={t("sessions.organizer", { name: session.organizerUserName })} />
          {!!deadlineLabel && isUpcoming && <InfoRow icon="timer" text={t(session.responseDeadline ? "sessions.replyBy" : "sessions.replyByStart", { date: deadlineLabel })} />}
          <SessionAttendance players={session.players ?? []} compact />
        </View>
        {isActive && myStatus === "Accepted" && <PrimaryButton title={t("sessions.registerMatch")}
          disabled={actionLoading} onPress={() => router.push({ pathname: "/games/sessions/register", params: { sessionId: session.id } })} />}
        {isPending && <View style={styles.section}>
          <Text style={styles.body}>{t("sessions.inviteQuestion")}</Text>
          <View style={styles.actions}>
            <PrimaryButton title={t("sessions.accept")} loading={actionLoading} onPress={() => handleRespondInvite(true)} />
            <PrimaryButton title={t("sessions.decline")} variant="secondary" disabled={actionLoading} onPress={() => handleRespondInvite(false)} />
          </View>
        </View>}
        {isUpcoming && <Text style={styles.hint}>{t("sessions.upcomingHint")}</Text>}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("sessions.matchesTitle", { count: matches.length })}</Text>
          {matches.length === 0 ? <Text style={styles.hint}>{t("sessions.noMatches")}</Text> : matches.map(m => (
            <Pressable key={m.id} style={styles.matchRow} accessibilityRole="button" accessibilityLabel={t("success.viewMatch") + ": " + m.gameName}
              onPress={() => router.push({ pathname: "/games/matches/[id]", params: { id: m.id, originSessionId: session.id } })}>
              <MatchSummary match={m} compact />
              <View style={styles.detailLink}><Text style={styles.hint}>{t("success.viewMatch")}</Text><MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} /></View>
            </Pressable>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("sessions.who")}</Text>
          {isOrganizer && isUpcoming && <SessionInvitations session={session} />}
          {session.players?.map(p => {
            const status = normalizeInviteStatus(p.status);
            return <View key={p.userId} style={styles.playerRow}>
              <Text style={styles.playerName}>{p.userName || t("sessions.playerNameUnavailable")}{p.isOrganizer ? ` · ${t("sessions.organizerRole")}` : ""}</Text>
              <Text style={[styles.playerStatus, { color: status === "Accepted" ? COLORS.success : status === "Declined" ? COLORS.error : COLORS.secondary }]}>
                {t(status === "Accepted" ? "sessions.accepted" : status === "Declined" ? "sessions.declined" : "sessions.pending")}
              </Text>
            </View>;
          })}
        </View>
        {isOrganizer && isActive && <PrimaryButton title={t("sessions.closeTitle")} variant="secondary" disabled={actionLoading} onPress={handleClose} />}
        {isOrganizer && isUpcoming && <PrimaryButton title={t("sessions.cancelTitle")} variant="secondary" disabled={actionLoading} onPress={handleCancel} />}
      </ScrollView>
    </ScreenLayout>
  );
}
function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; text: string }) {
  return <View style={styles.infoRow}><MaterialIcons name={icon} size={16} color={COLORS.textMuted} /><Text style={styles.body}>{text}</Text></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 24, gap: 16 },
  summary: { gap: 6 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  title: { ...UI_STYLES.title, flexGrow: 1, flexShrink: 1 },
  statusText: { ...UI_STYLES.caption, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  body: { ...UI_STYLES.body, color: COLORS.textMuted, flexShrink: 1 },
  hint: { ...UI_STYLES.caption, color: COLORS.textMuted },
  section: { gap: 8 },
  sectionTitle: { ...UI_STYLES.section },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailLink: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
  matchRow: { minHeight: 44, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  matchGame: { ...UI_STYLES.section },
  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  scoreName: { ...UI_STYLES.body, flex: 1 },
  score: { ...UI_STYLES.body, fontWeight: "700" },
  playerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  playerName: { ...UI_STYLES.body, flexGrow: 1, flexShrink: 1 },
  playerStatus: { ...UI_STYLES.caption, fontWeight: "700" },
});
