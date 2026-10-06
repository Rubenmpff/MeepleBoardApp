import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import { ROUTES } from "@/src/constants/routes";
import { invalidateFriendsCache } from "../hooks/useFriends";
import { sendFriendRequest, searchUsers, UserSearchResult } from "../services/friendshipService";
import { avatarColors } from "../utils/avatarPalette";
import OnlineDot from "../components/OnlineDot";

export default function UserSearchScreen() {
  const { t } = useTranslation("friends");
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
      catch { Alert.alert(t("text.unableToSearch"), t("text.checkYourConnectionAndTryAgain")); }
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
    } catch { Alert.alert(t("text.requestNotSent"), t("text.theRequestMayAlreadyExistRefreshTheSearchAndTryAgain")); }
    finally { setBusyId(null); }
  }

  return (
    <ScreenLayout keyboard title={t("text.findPeople")}>
      <Text style={styles.searchDescription}>{t("text.findPeopleByNameOrUsername")}</Text>

      <View style={styles.search}>
        <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
        <TextInput accessibilityLabel={t("text.nameOrUsername")} autoFocus value={query} onChangeText={setQuery} placeholder={t("text.nameOrUsername")} placeholderTextColor={COLORS.textMuted} style={styles.input} autoCapitalize="none" />
        {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
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
            <Text style={styles.emptyText}>{query.length < 2 ? t("text.enterAtLeast2Characters") : loading ? "" : t("text.noUsersFoundWithThatName")}</Text>
          </View>
        }
      />
    </ScreenLayout>
  );
}

function RelationshipAction({ item, busy, onAdd, onRequests }: { item: UserSearchResult; busy: boolean; onAdd: () => void; onRequests: () => void }) {
  const { t } = useTranslation("friends");
  if (busy) return <ActivityIndicator color={COLORS.primary} />;
  if (item.relationshipStatus === "friends") return <Text style={styles.status}>{t("text.friends")}</Text>;
  if (item.relationshipStatus === "outgoingPending") return <Text style={styles.status}>{t("text.requestSent")}</Text>;
  if (item.relationshipStatus === "incomingPending") return <TouchableOpacity style={styles.outlineButton} onPress={onRequests}><Text style={styles.outlineText}>{t("text.respond")}</Text></TouchableOpacity>;
  if (item.relationshipStatus === "blocked") return <Text style={styles.status}>{t("text.unavailable")}</Text>;
  return <TouchableOpacity style={styles.addButton} onPress={onAdd}><Text style={styles.addText}>{t("text.add")}</Text></TouchableOpacity>;
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
  searchDescription: {
    ...UI_STYLES.body, color: COLORS.textMuted, paddingHorizontal: 16
  },

  search: { marginHorizontal: 16, marginTop: 14, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, ...cardShadow },
  input: {
    ...UI_STYLES.body, flex: 1, minHeight: 52, marginLeft: 10, color: COLORS.onBackground
  },
  list: { padding: 16, flexGrow: 1 },

  card: {
    flexWrap: "wrap", gap: 12, ...UI_STYLES.card, flexDirection: "row", alignItems: "center", padding: 13, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 20, ...cardShadow
  },
  identity: { minWidth: "60%", minHeight: 44, flex: 1, flexDirection: "row", alignItems: "center" },
  avatarWrap: {},
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800" },
  nameBlock: { marginLeft: 12, flex: 1 },
  name: { color: COLORS.onBackground, fontWeight: "800" },
  username: {
    ...UI_STYLES.caption, color: COLORS.textMuted, fontSize: 13, marginTop: 2
  },

  addButton: {
    ...UI_STYLES.control, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.primary
  },
  addText: {
    ...UI_STYLES.caption, color: "#fff", fontWeight: "800", fontSize: 13
  },
  outlineButton: {
    ...UI_STYLES.control, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: `${COLORS.primary}14`
  },
  outlineText: {
    ...UI_STYLES.caption, color: COLORS.primary, fontWeight: "800", fontSize: 13
  },
  status: {
    ...UI_STYLES.caption, color: COLORS.textMuted, fontSize: 13, fontWeight: "700"
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: `${COLORS.primary}12` },
  emptyText: { marginTop: 14, color: COLORS.textMuted, textAlign: "center" },
});
