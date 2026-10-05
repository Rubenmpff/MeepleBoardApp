import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/src/constants/colors";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { ROUTES } from "@/src/constants/routes";
import { invalidateFriendsCache } from "../hooks/useFriends";
import { sendFriendRequest, searchUsers, UserSearchResult } from "../services/friendshipService";
import { avatarColors } from "../utils/avatarPalette";
import OnlineDot from "../components/OnlineDot";

export default function UserSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) { setResults([]); setLoading(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchUsers(normalized)); }
      catch { Alert.alert("Não foi possível pesquisar", "Verifica a ligação e tenta novamente."); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  async function add(user: UserSearchResult) {
    setBusyId(user.id);
    try {
      await sendFriendRequest(user.id);
      setResults(current => current.map(item => item.id === user.id ? { ...item, relationshipStatus: "outgoingPending" } : item));
      invalidateFriendsCache();
    } catch { Alert.alert("Pedido não enviado", "O pedido pode já existir. Atualiza a pesquisa e tenta novamente."); }
    finally { setBusyId(null); }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom", "top"]}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          mode="back"
          title="Procurar utilizadores"
          subtitle="Encontra pessoas pelo nome ou username."
        />
      </View>

      <View style={styles.search}>
        <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
        <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Nome ou username..." placeholderTextColor={COLORS.textMuted} style={styles.input} autoCapitalize="none" />
        {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const colors = avatarColors(item.userName);
          return (
            <View style={styles.card}>
              <TouchableOpacity style={styles.identity} onPress={() => router.push({ pathname: ROUTES.USER_PROFILE, params: { id: item.id } } as never)}>
                <View style={styles.avatarWrap}>
                  {item.profilePictureUrl ? (
                    <Image source={{ uri: item.profilePictureUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.avatarText, { color: colors.fg }]}>{item.userName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  {item.isOnline && <OnlineDot />}
                </View>
                <View style={styles.nameBlock}><Text style={styles.name}>{item.userName}</Text><Text style={styles.username}>@{item.userName}</Text></View>
              </TouchableOpacity>
              <RelationshipAction item={item} busy={busyId === item.id} onAdd={() => add(item)} onRequests={() => router.push(ROUTES.FRIEND_REQUESTS as never)} />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}><Ionicons name={query.length < 2 ? "people-outline" : "search-outline"} size={40} color={COLORS.primary} /></View>
            <Text style={styles.emptyText}>{query.length < 2 ? "Escreve pelo menos 2 caracteres." : loading ? "" : "Não encontrámos utilizadores com esse nome."}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function RelationshipAction({ item, busy, onAdd, onRequests }: { item: UserSearchResult; busy: boolean; onAdd: () => void; onRequests: () => void }) {
  if (busy) return <ActivityIndicator color={COLORS.primary} />;
  if (item.relationshipStatus === "friends") return <Text style={styles.status}>✓ Amigos</Text>;
  if (item.relationshipStatus === "outgoingPending") return <Text style={styles.status}>Pedido enviado</Text>;
  if (item.relationshipStatus === "incomingPending") return <TouchableOpacity style={styles.outlineButton} onPress={onRequests}><Text style={styles.outlineText}>Responder</Text></TouchableOpacity>;
  if (item.relationshipStatus === "blocked") return <Text style={styles.status}>Indisponível</Text>;
  return <TouchableOpacity style={styles.addButton} onPress={onAdd}><Text style={styles.addText}>Adicionar</Text></TouchableOpacity>;
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
  headerWrap: { paddingHorizontal: 18, paddingTop: 8 },

  search: { marginHorizontal: 18, marginTop: 14, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 16, paddingHorizontal: 14, ...cardShadow },
  input: { flex: 1, minHeight: 50, marginLeft: 10, color: COLORS.onBackground },
  list: { padding: 18, flexGrow: 1 },

  card: { flexDirection: "row", alignItems: "center", padding: 13, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 16, ...cardShadow },
  identity: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatarWrap: {},
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800" },
  nameBlock: { marginLeft: 12, flex: 1 },
  name: { color: COLORS.onBackground, fontWeight: "800" },
  username: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  addButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.primary },
  addText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  outlineButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: `${COLORS.primary}14` },
  outlineText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  status: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: `${COLORS.primary}12` },
  emptyText: { marginTop: 14, color: COLORS.textMuted, textAlign: "center" },
});