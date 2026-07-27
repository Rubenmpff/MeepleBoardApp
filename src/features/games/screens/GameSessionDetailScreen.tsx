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

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, ActivityIndicator, RefreshControl,
  StyleSheet, Alert, ScrollView, TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import sessionService from "@/src/features/games/services/sessionService";
import { GameSession, getStatusColor, getStatusLabel } from "@/src/features/games/types/GameSession";
import { normalizeInviteStatus, sessionPlayerGuards } from "@/src/features/games/types/GameSessionPlayer";
import RegisterMatchForm from "@/src/features/games/components/RegisterMatchForm";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";

export default function GameSessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSession = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return;
    try {
      if (!opts?.silent) setLoading(true);
      const data = await sessionService.getById(id);
      setSession(data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os detalhes da sessão.");
    } finally {
      if (!opts?.silent) setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

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
    ? new Date(session.scheduledStartDate).toLocaleString("pt-PT", {
        weekday: "long", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const deadlineLabel = session?.effectiveDeadline
    ? new Date(session.effectiveDeadline).toLocaleString("pt-PT", {
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
        accept ? "✅ Convite aceite!" : "❌ Convite recusado",
        accept ? "Vais participar nesta sessão." : "O organizador será notificado."
      );
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível responder ao convite.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar sessão",
      "Tens a certeza que queres cancelar esta sessão? Esta ação não pode ser desfeita.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, cancelar", style: "destructive",
          onPress: async () => {
            if (!id) return;
            setActionLoading(true);
            try {
              await sessionService.cancel(id);
              Alert.alert("Sessão cancelada", "A sessão foi cancelada.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert("Erro", err?.message ?? "Não foi possível cancelar a sessão.");
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
      "Encerrar sessão",
      "Tens a certeza que queres encerrar esta sessão?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, encerrar", style: "destructive",
          onPress: async () => {
            if (!id) return;
            setActionLoading(true);
            try {
              await sessionService.close(id);
              await fetchSession({ silent: true });
            } catch (err: any) {
              Alert.alert("Erro", err?.message ?? "Não foi possível encerrar a sessão.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Sessão não encontrada.</Text>
      </View>
    );
  }

  /* ── Render ── */
  return (
    <ScrollView
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
          <Text style={styles.title} numberOfLines={2}>{session.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(session.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
              {getStatusLabel(session.status)}
            </Text>
          </View>
        </View>

        {!!session.location && <InfoRow icon="place" text={session.location} />}
        {!!scheduledLabel && <InfoRow icon="schedule" text={scheduledLabel} />}
        {!!deadlineLabel && isUpcoming && (
          <InfoRow icon="timer" text={`Prazo de resposta: ${deadlineLabel}`} color="#f39c12" />
        )}
        <InfoRow icon="person" text={`Organizer: ${session.organizerUserName}`} />

        {/* Confirmações */}
        {!isCancelled && !isClosed && (
          <View style={styles.confirmBar}>
            <Text style={styles.confirmText}>
              {session.acceptedGuestCount ?? 0} confirmado(s) de {(session.players?.length ?? 1) - 1} convidado(s)
            </Text>
            <View style={styles.confirmDots}>
              {session.players?.filter((p) => !p.isOrganizer).map((p) => (
                <View
                  key={p.userId}
                  style={[
                    styles.confirmDot,
                    normalizeInviteStatus(p.status) === "Accepted" && styles.confirmDotAccepted,
                    normalizeInviteStatus(p.status) === "Declined" && styles.confirmDotDeclined,
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ── Responder convite ── */}
      {isPending && (
        <View style={styles.inviteCard}>
          <MaterialIcons name="mail" size={20} color={COLORS.primary} />
          <Text style={styles.inviteText}>
            Foste convidado para esta sessão. Queres participar?
          </Text>
          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={[styles.inviteBtn, styles.inviteBtnAccept]}
              onPress={() => handleRespondInvite(true)}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.inviteBtnText}>✅ Aceitar</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inviteBtn, styles.inviteBtnDecline]}
              onPress={() => handleRespondInvite(false)}
              disabled={actionLoading}
            >
              <Text style={styles.inviteBtnText}>❌ Recusar</Text>
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
              disabled={actionLoading}
            >
              <MaterialIcons name="lock" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Encerrar sessão</Text>
            </TouchableOpacity>
          )}
          {isUpcoming && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnCancel]}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              <MaterialIcons name="cancel" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Cancelar sessão</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Participantes ── */}
      <View style={styles.card}>
        <SectionTitle icon="people" label="Participantes" />
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
                  status === "Accepted" && { color: "#388E3C" },
                  status === "Declined" && { color: COLORS.error },
                  status === "Pending"  && { color: "#f39c12" },
                ]}>
                  {status === "Accepted" ? "Confirmado"
                    : status === "Declined" ? "Recusou"
                    : "Pendente"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Registar partida — disableScroll para evitar ScrollView aninhado ── */}
      {isActive && (
        <View style={styles.card}>
          <SectionTitle icon="sports-esports" label="Registar partida" />
          <RegisterMatchForm
            sessionId={session.id}
            disableScroll={true}  // ✅ evita ScrollView dentro de ScrollView
          />
        </View>
      )}

      {/* ── Info quando Upcoming ── */}
      {isUpcoming && (
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={16} color="#856404" />
          <Text style={styles.infoBoxText}>
            Esta sessão ainda não começou. Só podes registar partidas quando estiver Ativa.
          </Text>
        </View>
      )}

      {/* ── Partidas ── */}
      <View style={styles.card}>
        <SectionTitle icon="emoji-events" label={`Partidas (${matches.length})`} />
        {matches.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma partida registada.</Text>
        ) : (
          matches.map((m, index) => {
            const key = (m as any).id ?? `match-${index}`;
            return (
              <View key={key} style={styles.matchCard}>
                <Text style={styles.matchGame}>{(m as any).gameName ?? "Jogo desconhecido"}</Text>
                <Text style={styles.matchDetail}>🏆 {(m as any).winnerName ?? "Sem vencedor"}</Text>
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
      <MaterialIcons name={icon as any} size={14} color={color ?? "#888"} />
      <Text style={[styles.infoRowText, color ? { color } : {}]}>{text}</Text>
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },

  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.primary, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  infoRowText: { fontSize: 13, color: "#666", flex: 1 },

  confirmBar: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  confirmText: { fontSize: 12, color: "#888", marginBottom: 6 },
  confirmDots: { flexDirection: "row", gap: 4 },
  confirmDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e0e0e0" },
  confirmDotAccepted: { backgroundColor: "#388E3C" },
  confirmDotDeclined: { backgroundColor: COLORS.error },

  inviteCard: {
    backgroundColor: COLORS.primary + "0A", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primary + "30", alignItems: "center", gap: 10,
  },
  inviteText: { fontSize: 14, color: COLORS.onBackground, textAlign: "center", fontWeight: "600" },
  inviteActions: { flexDirection: "row", gap: 10, width: "100%" },
  inviteBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  inviteBtnAccept: { backgroundColor: COLORS.success },
  inviteBtnDecline: { backgroundColor: COLORS.error },
  inviteBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnClose: { backgroundColor: "#555" },
  actionBtnCancel: { backgroundColor: COLORS.error },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitleText: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground },

  playerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + "1A", alignItems: "center", justifyContent: "center" },
  playerAvatarText: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  playerName: { fontSize: 14, fontWeight: "600", color: COLORS.onBackground },
  playerStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  playerStatusAccepted: { backgroundColor: "#E8F5E9" },
  playerStatusDeclined: { backgroundColor: "#FFEBEE" },
  playerStatusPending: { backgroundColor: "#FFF8E1" },
  playerStatusText: { fontSize: 11, fontWeight: "700" },

  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fff8e1", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ffe082" },
  infoBoxText: { flex: 1, fontSize: 13, color: "#856404", lineHeight: 18 },

  matchCard: { backgroundColor: "#f9f9f9", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#eee" },
  matchGame: { fontSize: 15, fontWeight: "700", color: COLORS.onBackground },
  matchDetail: { fontSize: 13, color: "#666", marginTop: 4 },

  emptyText: { textAlign: "center", color: "#aaa", fontSize: 13, paddingVertical: 10 },
});