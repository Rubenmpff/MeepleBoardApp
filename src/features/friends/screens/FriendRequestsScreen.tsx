import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import { invalidateFriendsCache } from "../hooks/useFriends";
import { acceptFriendRequest, cancelFriendRequest, getIncomingRequests, getOutgoingRequests, IncomingFriendRequest, OutgoingFriendRequest, rejectFriendRequest } from "../services/friendshipService";
import { avatarColors } from "../utils/avatarPalette";

export default function FriendRequestsScreen() {
  const { t } = useTranslation("friends");
  const [incoming, setIncoming] = useState<IncomingFriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [received, sent] = await Promise.all([getIncomingRequests(), getOutgoingRequests()]); setIncoming(received); setOutgoing(sent); }
    catch { Alert.alert(t("text.unableToLoadRequests"), t("text.tryAgainInAMoment")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(requestId: string, action: "accept" | "reject" | "cancel") {
    setBusy(requestId);
    try {
      if (action === "accept") await acceptFriendRequest(requestId);
      else if (action === "reject") await rejectFriendRequest(requestId);
      else await cancelFriendRequest(requestId);
      setIncoming(current => current.filter(x => x.requestId !== requestId));
      setOutgoing(current => current.filter(x => x.requestId !== requestId));
      invalidateFriendsCache();
      if (action === "accept") Alert.alert(t("text.requestAccepted"), t("text.youAreNowFriendsOnMeepleBoard"));
    } catch { Alert.alert(t("text.unableToCompleteAction"), t("text.refreshRequestsAndTryAgain")); }
    finally { setBusy(null); }
  }

  if (loading) return <ScreenLayout title={t("text.friendRequests")}><ScreenState loading message={t("card.loading")} /></ScreenLayout>;

  return (
    <ScreenLayout title={t("text.friendRequests")}>
      <ScrollView contentContainerStyle={styles.content}>

        <SectionTitle title={t("text.received")} count={incoming.length} />
        {incoming.map((item) => (
          <View key={item.requestId} style={styles.card}>
            <Avatar name={item.fromUserName} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.fromUserName}</Text>
              <Text style={styles.meta}>{t("text.sentYouARequest")}</Text>
              <View style={styles.actions}>
                <TouchableOpacity disabled={busy === item.requestId} style={styles.primary} onPress={() => act(item.requestId, "accept")}>
                  <Text style={styles.primaryText}>{t("text.accept")}</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={busy === item.requestId} style={styles.secondary} onPress={() => act(item.requestId, "reject")}>
                  <Text style={styles.secondaryText}>{t("text.decline")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {incoming.length === 0 && <Empty text={t("text.noIncomingRequests")} />}

        <SectionTitle title={t("text.sent")} count={outgoing.length} />
        {outgoing.map((item) => (
          <View key={item.requestId} style={styles.card}>
            <Avatar name={item.toUserName} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.toUserName}</Text>
              <View style={styles.pendingPill}><Text style={styles.pendingPillText}>{t("text.pending")}</Text></View>
              <TouchableOpacity disabled={busy === item.requestId} style={UI_STYLES.control} onPress={() => act(item.requestId, "cancel")}>
                <Text style={styles.cancel}>{t("text.cancelRequest")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {outgoing.length === 0 && <Empty text={t("text.noPendingOutgoingRequests")} />}
      </ScrollView>
    </ScreenLayout>
  );
}

function Avatar({ name }: { name: string }) {
  const colors = avatarColors(name);
  return <View style={[styles.avatar, { backgroundColor: colors.bg }]}><Text style={[styles.avatarText, { color: colors.fg }]}>{name.charAt(0).toUpperCase()}</Text></View>;
}
function SectionTitle({ title, count }: { title: string; count: number }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View></View>;
}
function Empty({ text }: { text: string }) {
  return <View style={styles.empty}><Ionicons name="checkmark-circle-outline" size={22} color={COLORS.textMuted} /><Text style={styles.emptyText}>{text}</Text></View>;
}

const cardShadow = {
  shadowColor: "#0B1220",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 12 },
  sectionTitle: {
    ...UI_STYLES.section, fontSize: 18, fontWeight: "800", color: COLORS.onBackground
  },
  badge: { marginLeft: 8, backgroundColor: `${COLORS.primary}18`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: {
    ...UI_STYLES.caption, color: COLORS.primary, fontWeight: "800", fontSize: 13
  },

  card: {
    ...UI_STYLES.card, flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 20, padding: 14, marginBottom: 10, ...cardShadow
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: {
    ...UI_STYLES.body, fontWeight: "800", fontSize: 17
  },
  info: { flex: 1, marginLeft: 13 },
  name: {
    ...UI_STYLES.body, fontWeight: "800", color: COLORS.onBackground, fontSize: 15
  },
  meta: {
    ...UI_STYLES.caption, marginTop: 3, color: COLORS.textMuted, fontSize: 13
  },
  actions: { flexWrap: "wrap", flexDirection: "row", marginTop: 12 },
  primary: {
    ...UI_STYLES.control, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8
  },
  primaryText: {
    ...UI_STYLES.caption, color: "#fff", fontWeight: "800", fontSize: 13
  },
  secondary: {
    ...UI_STYLES.control, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10
  },
  secondaryText: {
    ...UI_STYLES.caption, color: COLORS.onBackground, fontWeight: "700", fontSize: 13
  },
  pendingPill: { alignSelf: "flex-start", marginTop: 4, backgroundColor: `${COLORS.secondary}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  pendingPillText: {
    ...UI_STYLES.caption, color: COLORS.secondary, fontWeight: "800", fontSize: 13
  },
  cancel: {
    ...UI_STYLES.control, ...UI_STYLES.caption, marginTop: 10, color: COLORS.error, fontWeight: "700", fontSize: 13
  },
  empty: { flexDirection: "row", alignItems: "center", padding: 15, marginBottom: 16, borderRadius: 15, backgroundColor: COLORS.surface },
  emptyText: { marginLeft: 8, color: COLORS.textMuted },
});
