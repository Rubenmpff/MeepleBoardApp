/**
 * GameSessionDetailScreen.tsx
 *
 * Detalhe de uma sessão de jogo.
 * - Organizer: pode cancelar (Upcoming) ou encerrar (Active)
 * - Convidado: pode aceitar/recusar convite (Pending)
 * - Lista de participantes com status
 * - Registo de partidas (só quando Active) — usa disableScroll para evitar ScrollView aninhado
 * - Lista de partidas da sessão
 */
import { SESSION_STATUS_COLORS } from "@/src/styles/statusColors";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, RefreshControl, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import sessionService from "@/src/features/games/sessions/services/sessionService";
import { GameSession, getStatusColor } from "@/src/features/games/sessions/types/GameSession";
import { normalizeInviteStatus } from "@/src/features/games/sessions/types/GameSessionPlayer";
import RegisterMatchForm from "@/src/features/games/matches/components/RegisterMatchForm";
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
  const isClosed    = session?.status === "Closed";
  const isCancelled = session?.status === "Cancelled";
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
  /* ── Render ── */
  return (
    <ScreenLayout title={t("sessions.details")} keyboard>
    <ScrollView
        keyboardDismissMode="on-drag"
      style={styles.screen}
      contentContainerStyle={styles.scroll}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchSession({ silent: true }); }}
          colors={[COLORS.primary]}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header card ── */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{session.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: SESSION_STATUS_COLORS[session.status] + "20" }]}>
            <Text style={[styles.statusText, { color: SESSION_STATUS_COLORS[session.status] }]}>
              {t("sessions.status." + session.status)}
            </Text>
          </View>
        </View>
        {!!session.location && <InfoRow icon="place" text={session.location} />}
        {!!scheduledLabel && <InfoRow icon="schedule" text={scheduledLabel} />}
        {!!deadlineLabel && isUpcoming && (
          <InfoRow icon="timer" text={t(session?.responseDeadline ? "sessions.replyBy" : "sessions.replyByStart", { date: deadlineLabel })} color={COLORS.secondary} />
        )}
        <InfoRow icon="person" text={t("sessions.organizer", { name: session.organizerUserName })} />
      </View>
      {/* ── Responder convite ── */}
      {isPending && (
        <View style={styles.inviteCard}>
          <MaterialIcons name="mail" size={20} color={COLORS.primary} />
          <Text style={styles.inviteText}>
            {t("sessions.inviteQuestion")}</Text>
          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={[styles.inviteBtn, styles.inviteBtnAccept]}
              onPress={() => handleRespondInvite(true)}
              disabled={actionLoading} accessibilityRole="button" accessibilityLabel={t("sessions.accept")}
            >
              {actionLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.inviteBtnText}>{t("sessions.accept")}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inviteBtn, styles.inviteBtnDecline]}
              onPress={() => handleRespondInvite(false)}
              disabled={actionLoading} accessibilityRole="button" accessibilityLabel={t("sessions.decline")}
            >
              <Text style={styles.inviteBtnText}>{t("sessions.decline")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* ── Ações do organizer ── */}
      {isOrganizer && (isUpcoming || isActive) && (
        <View style={styles.actionsRow}>
          {isActive && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnClose]}
              onPress={handleClose}
              disabled={actionLoading} accessibilityRole="button" accessibilityLabel={t("sessions.closeTitle")}
            >
              <MaterialIcons name="lock" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>{t("sessions.closeTitle")}</Text>
            </TouchableOpacity>
          )}
          {isUpcoming && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnCancel]}
              onPress={handleCancel}
              disabled={actionLoading} accessibilityRole="button" accessibilityLabel={t("sessions.cancelTitle")}
            >
              <MaterialIcons name="cancel" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>{t("sessions.cancelTitle")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {/* ── Participantes ── */}
      <View style={styles.card}>
        <SectionTitle icon="people" label={t("sessions.who")} />
        <SessionAttendance players={session.players ?? []} />
        {isOrganizer && isUpcoming && <SessionInvitations session={session} />}
        {session.players?.map((p) => {
          const status = normalizeInviteStatus(p.status);
          return (
            <View key={p.userId} style={styles.playerRow}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>
                  {p.userName[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>
                  {p.userName}{p.isOrganizer ? " 👑" : ""}
                </Text>
              </View>
              <View style={[
                styles.playerStatusPill,
                status === "Accepted" && styles.playerStatusAccepted,
                status === "Declined" && styles.playerStatusDeclined,
                status === "Pending"  && styles.playerStatusPending,
              ]}>
                <Text style={[
                  styles.playerStatusText,
                  status === "Accepted" && { color: COLORS.success },
                  status === "Declined" && { color: COLORS.error },
                  status === "Pending"  && { color: COLORS.secondary },
                ]}>
                  {status === "Accepted" ? t("sessions.accepted")
                    : status === "Declined" ? t("sessions.declined")
                    : t("sessions.pending")}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      {/* ── Registar partida — disableScroll para evitar ScrollView aninhado ── */}
      {isActive && (
        <View style={styles.card}>
          <RegisterMatchForm
            sessionId={session.id}
            currentUser={currentUser ?? undefined}
            onRegistered={() => { void fetchSession({ silent: true }); }}
            disableScroll={true}  // ✅ evita ScrollView dentro de ScrollView
          />
        </View>
      )}
      {/* ── Info quando Upcoming ── */}
      {isUpcoming && (
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={16} color="#856404" />
          <Text style={styles.infoBoxText}>
            {t("sessions.upcomingHint")}</Text>
        </View>
      )}
      {/* ── Partidas ── */}
      <View style={styles.card}>
        <SectionTitle icon="emoji-events" label={t("sessions.matchesTitle", { count: matches.length })} />
        {matches.length === 0 ? (
          <Text style={styles.emptyText}>{t("sessions.noMatches")}</Text>
        ) : (
          matches.map((m, index) => {
            const key = (m as any).id ?? `match-${index}`;
            return (
              <View key={key} style={styles.matchCard}>
                <Text style={styles.matchGame}>{(m as any).gameName ?? t("sessions.unknownGame")}</Text>
                <Text style={styles.matchDetail}>🏆 {(m as any).winnerName ?? t("sessions.noWinner")}</Text>
                {!!(m as any).durationInMinutes && (
                  <Text style={styles.matchDetail}>⏱ {(m as any).durationInMinutes} min</Text>
                )}
              </View>
            );
          })
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
    </ScreenLayout>
  );
}
/* ── Sub-components ── */
function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <MaterialIcons name={icon as any} size={16} color={COLORS.primary} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}
function InfoRow({ icon, text, color }: { icon: string; text: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon as any} size={14} color={color ?? COLORS.textMuted} />
      <Text style={[styles.infoRowText, color ? { color } : {}]}>{text}</Text>
    </View>
  );
}
/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },
  titleRow: { gap: 8, marginBottom: 12 },
  title: { ...UI_STYLES.title, flexShrink: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { ...UI_STYLES.caption, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  infoRowText: { ...UI_STYLES.body, color: COLORS.textMuted, flex: 1 },
  confirmBar: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  confirmText: { ...UI_STYLES.caption, color: COLORS.textMuted, marginBottom: 8 },
  confirmDots: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  confirmDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e0e0e0" },
  confirmDotAccepted: { backgroundColor: COLORS.success },
  confirmDotDeclined: { backgroundColor: COLORS.error },
  inviteCard: {
    backgroundColor: COLORS.primary + "0A", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primary + "30", alignItems: "center", gap: 10,
  },
  inviteText: { fontSize: 14, color: COLORS.onBackground, textAlign: "center", fontWeight: "600" },
  inviteActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%" },
  inviteBtn: { ...UI_STYLES.button, flex: 1, minWidth: 100 },
  inviteBtnAccept: { ...UI_STYLES.button, flex: 1, minWidth: 100, backgroundColor: COLORS.success },
  inviteBtnDecline: { ...UI_STYLES.button, flex: 1, minWidth: 100, backgroundColor: COLORS.error },
  inviteBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionBtn: { ...UI_STYLES.button, flex: 1, minWidth: 110, flexDirection: "row", gap: 8 },
  actionBtnClose: { backgroundColor: COLORS.textMuted },
  actionBtnCancel: { backgroundColor: COLORS.error },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitleText: { ...UI_STYLES.section, flexShrink: 1 },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + "1A", alignItems: "center", justifyContent: "center" },
  playerAvatarText: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  playerName: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700" },
  playerStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  playerStatusAccepted: { backgroundColor: "#E8F5E9" },
  playerStatusDeclined: { backgroundColor: "#FFEBEE" },
  playerStatusPending: { backgroundColor: "#FFF8E1" },
  playerStatusText: { ...UI_STYLES.caption, fontWeight: "700" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fff8e1", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ffe082" },
  infoBoxText: { ...UI_STYLES.body, color: "#856404", flex: 1 },
  matchCard: { backgroundColor: "#f9f9f9", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#eee" },
  matchGame: { ...UI_STYLES.section },
  matchDetail: { ...UI_STYLES.body, color: COLORS.textMuted, marginTop: 4 },
  emptyText: { ...UI_STYLES.empty },
});
