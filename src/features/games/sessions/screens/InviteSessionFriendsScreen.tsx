import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState } from "@/src/store/store";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { ROUTES } from "@/src/constants/routes";
import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import { useFriends } from "@/src/features/friends/hooks/useFriends";
import { UI_COLORS, APP_THEME } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import FriendSelector from "../components/FriendSelector";
import sessionService from "../services/sessionService";
import { InvitationResult, sendSessionInvitations } from "../utils/sendSessionInvitations";
import { GameSession } from "../types/GameSession";
import { normalizeInviteStatus } from "../types/GameSessionPlayer";

export default function InviteSessionFriendsScreen() {
  const { t } = useTranslation("matches");
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<(InvitationResult & { name: string })[]>([]);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const sending = useRef(false);
  const friends = useFriends();
  const firstFriendsFocus = useRef(true);
  useFocusEffect(useCallback(() => {
    if (firstFriendsFocus.current) firstFriendsFocus.current = false;
    else void friends.refetch(true);
  }, [friends.refetch]));
  const guard = useUnsavedChanges(selected.length > 0, busy, sessionId ? `/games/sessions/${sessionId}` : ROUTES.SESSIONS);
  const load = useCallback(async () => {
    setLoading(true); setLoadError(false);
    try { setSession(await sessionService.getById(sessionId)); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  }, [sessionId]);
  useEffect(() => { void load(); }, [load]);
  const unavailable: Record<string, string> = {};
  for (const player of session?.players ?? []) unavailable[player.userId] = t("sessions." + normalizeInviteStatus(player.status).toLowerCase());
  for (const result of results) if (result.status !== "failed" && !unavailable[result.userId]) unavailable[result.userId] = t("sessions.pending");
  async function submit() {
    if (sending.current || !selected.length || !user || friends.loading || friends.error) return;
    sending.current = true;
    setBusy(true);
    try {
      const batch = await sendSessionInvitations(sessionId, selected, user.id, sessionService.getById, sessionService.addPlayer);
      setRefreshFailed(batch.refreshFailed);
      if (batch.session) setSession(batch.session);
      setResults(previous => [...previous.filter(r => !selected.includes(r.userId)), ...batch.results.map(r => ({ ...r, name: friends.friends.find(f => f.id === r.userId)?.userName || previous.find(p => p.userId === r.userId)?.name || t("sessions.friendLabel") }))]);
      setSelected(batch.results.filter(r => r.status === "failed").map(r => r.userId));
    } finally { sending.current = false; setBusy(false); }
  }
  return <ScreenLayout title={t("sessions.inviteFriends")} keyboard mode={results.length && !selected.length ? "back" : "cancel"} onCancel={guard.cancel}>
    {loading ? <ScreenState loading message={t("ui.loading")} /> : loadError || !session ? (
      <ScreenState error message={t("sessions.loadError")} onRetry={load} retryLabel={t("common:retry")} />
    ) : session.organizerId !== user?.id || session.status !== "Upcoming" ? <ScreenState message={t("sessions.inviteUnavailable")} /> : <>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={UI_STYLES.section}>{session.name}</Text>
        {refreshFailed && <Text accessibilityRole="alert" style={{ ...UI_STYLES.body, color: UI_COLORS.error }}>{t("sessions.inviteRefreshFailed")}</Text>}
        {!!results.length && <View style={[UI_STYLES.card, { padding: 16, gap: 8 }]} accessibilityLiveRegion="polite">
          <Text style={UI_STYLES.section}>{t("sessions.inviteResults")}</Text>
          {results.map(result => <Text key={result.userId} style={[UI_STYLES.body, { color: result.status === "failed" ? UI_COLORS.error : UI_COLORS.onBackground }]}>
            {result.name}: {t("sessions.result." + (result.reason || result.status))}
          </Text>)}
          {results.some(r => r.status === "failed") && <Text style={UI_STYLES.caption}>{t("sessions.retryFailedHint")}</Text>}
        </View>}
        <FriendSelector {...friends} selectedIds={selected} onChange={ids => { guard.markUnsaved(); setSelected(ids); }} unavailable={unavailable} busy={busy}
          onRetry={() => void friends.refetch(true)} emptyMessage={t("sessions.noFriendsForInvite")}
          onFriends={() => guard.discard(() => { guard.allowExit(); router.push(ROUTES.FRIENDS); })} />
      </ScrollView>
      <View style={{ padding: 16, gap: 8, borderTopWidth: 1, borderColor: UI_COLORS.border, backgroundColor: APP_THEME.colors.card }}>
        <PrimaryButton title={t("sessions.sendInvites", { count: selected.length })} onPress={submit} loading={busy}
          disabled={!selected.length || friends.loading || !!friends.error} />
        {!selected.length && !!results.length && <PrimaryButton title={t("sessions.backToSession")} variant="secondary" onPress={guard.cancel} />}
      </View>
    </>}
  </ScreenLayout>;
}
