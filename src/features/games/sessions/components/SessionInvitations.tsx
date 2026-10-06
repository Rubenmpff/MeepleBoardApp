import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { ROUTES } from "@/src/constants/routes";
import { useFriends } from "@/src/features/friends/hooks/useFriends";
import { UI_COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import sessionService from "../services/sessionService";
import { GameSession } from "../types/GameSession";
import { normalizeInviteStatus } from "../types/GameSessionPlayer";

export default function SessionInvitations({ session, onInvited }: { session: GameSession; onInvited: () => Promise<void> }) {
  const { t } = useTranslation("matches");
  const router = useRouter();
  const { friends, loading, error, refetch } = useFriends();
  const [busy, setBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const guests = session.players.filter(p => !p.isOrganizer);
  const allDeclined = guests.length > 0 && guests.every(p => normalizeInviteStatus(p.status) === "Declined");
  const available = friends.filter(f => !session.players.some(p => p.userId === f.id));
  async function invite(userId: string) {
    if (busy) return;
    setBusy(true);
    setInviteError(null);
    try {
      await sessionService.addPlayer(session.id, userId);
      await onInvited();
    } catch (error: any) {
      setInviteError(error?.response?.data?.message || t("sessions.inviteError"));
    } finally { setBusy(false); }
  }
  return (
    <View style={[UI_STYLES.card, { padding: 16, marginBottom: 16, gap: 12 }]}>
      <Text style={UI_STYLES.section}>{t("sessions.inviteOthers")}</Text>
      {allDeclined && <Text style={UI_STYLES.body}>{t("sessions.allDeclined")}</Text>}
      {inviteError && <Text accessibilityRole="alert" style={{ color: UI_COLORS.error }}>{inviteError}</Text>}
      {loading ? <ActivityIndicator color={UI_COLORS.primary} /> : error ? (
        <>
          <Text accessibilityRole="alert" style={{ color: UI_COLORS.error }}>{error}</Text>
          <PrimaryButton title={t("common:retry")} onPress={() => void refetch(true)} />
        </>
      ) : available.length ? available.map(friend => (
        <PrimaryButton key={friend.id} title={t("sessions.inviteNamedFriend", { name: friend.userName })}
          disabled={busy} onPress={() => void invite(friend.id)} />
      )) : (
        <>
          <Text style={UI_STYLES.body}>{t(friends.length ? "sessions.noMoreFriends" : "sessions.noFriendsForInvite")}</Text>
          <PrimaryButton title={t("sessions.openFriends")} onPress={() => router.push(ROUTES.FRIENDS)} />
        </>
      )}
      {busy && <ActivityIndicator color={UI_COLORS.primary} />}
    </View>
  );
}
