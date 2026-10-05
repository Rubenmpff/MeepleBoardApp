import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/src/constants/colors";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { invalidateFriendsCache } from "../hooks/useFriends";
import { acceptFriendRequest, cancelFriendRequest, getIncomingRequests, getOutgoingRequests, IncomingFriendRequest, OutgoingFriendRequest, rejectFriendRequest } from "../services/friendshipService";
import { avatarColors } from "../utils/avatarPalette";

export default function FriendRequestsScreen() {
  const [incoming, setIncoming] = useState<IncomingFriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [received, sent] = await Promise.all([getIncomingRequests(), getOutgoingRequests()]); setIncoming(received); setOutgoing(sent); }
    catch { Alert.alert("Não foi possível carregar os pedidos", "Tenta novamente dentro de instantes."); }
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
      if (action === "accept") Alert.alert("Pedido aceite", "Agora já são amigos no MeepleBoard.");
    } catch { Alert.alert("Não foi possível concluir", "Atualiza os pedidos e tenta novamente."); }
    finally { setBusy(null); }
  }

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom", "top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          mode="back"
          title="Pedidos de amizade"
        />

        <SectionTitle title="Recebidos" count={incoming.length} />
        {incoming.map((item) => (
          <View key={item.requestId} style={styles.card}>
            <Avatar name={item.fromUserName} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.fromUserName}</Text>
              <Text style={styles.meta}>Enviou-te um pedido</Text>
              <View style={styles.actions}>
                <TouchableOpacity disabled={busy === item.requestId} style={styles.primary} onPress={() => act(item.requestId, "accept")}>
                  <Text style={styles.primaryText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={busy === item.requestId} style={styles.secondary} onPress={() => act(item.requestId, "reject")}>
                  <Text style={styles.secondaryText}>Recusar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {incoming.length === 0 && <Empty text="Não tens pedidos recebidos." />}

        <SectionTitle title="Enviados" count={outgoing.length} />
        {outgoing.map((item) => (
          <View key={item.requestId} style={styles.card}>
            <Avatar name={item.toUserName} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.toUserName}</Text>
              <View style={styles.pendingPill}><Text style={styles.pendingPillText}>Pendente</Text></View>
              <TouchableOpacity disabled={busy === item.requestId} onPress={() => act(item.requestId, "cancel")}>
                <Text style={styles.cancel}>Cancelar pedido</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {outgoing.length === 0 && <Empty text="Não tens pedidos enviados pendentes." />}
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 18, paddingBottom: 40 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.onBackground },
  badge: { marginLeft: 8, backgroundColor: `${COLORS.primary}18`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },

  card: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 18, padding: 14, marginBottom: 10, ...cardShadow },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", fontSize: 17 },
  info: { flex: 1, marginLeft: 13 },
  name: { fontWeight: "800", color: COLORS.onBackground, fontSize: 15 },
  meta: { marginTop: 3, color: COLORS.textMuted, fontSize: 13 },
  actions: { flexDirection: "row", marginTop: 12 },
  primary: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  secondary: { backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  secondaryText: { color: COLORS.onBackground, fontWeight: "700", fontSize: 12 },
  pendingPill: { alignSelf: "flex-start", marginTop: 4, backgroundColor: `${COLORS.secondary}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  pendingPillText: { color: COLORS.secondary, fontWeight: "800", fontSize: 11 },
  cancel: { marginTop: 10, color: COLORS.error, fontWeight: "700", fontSize: 13 },
  empty: { flexDirection: "row", alignItems: "center", padding: 15, marginBottom: 16, borderRadius: 15, backgroundColor: COLORS.surface },
  emptyText: { marginLeft: 8, color: COLORS.textMuted },
});