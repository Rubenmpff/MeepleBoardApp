import React, { useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";
import { useFriends } from "../hooks/useFriends";
import { FriendLite } from "../services/friendshipService";
import { avatarColors } from "../utils/avatarPalette";
import OnlineDot from "../components/OnlineDot";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";

type SortMode = "all" | "mostPlayed" | "recent";

export default function FriendsScreen() {
  const { t } = useTranslation("friends");
  const router = useRouter();
  const { friends, loading, error, refetch } = useFriends();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("all");
  const [refreshing, setRefreshing] = useState(false);

  const visibleFriends = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = normalized ? friends.filter((f) => f.userName.toLocaleLowerCase().includes(normalized)) : [...friends];
    if (sort === "mostPlayed") return filtered.sort((a, b) => b.sharedMatchesCount - a.sharedMatchesCount);
    if (sort === "recent") return filtered.sort((a, b) => new Date(b.lastPlayedAt ?? 0).getTime() - new Date(a.lastPlayedAt ?? 0).getTime());
    return filtered.sort((a, b) => a.userName.localeCompare(b.userName));
  }, [friends, query, sort]);

  async function refresh() { setRefreshing(true); try { await refetch(true); } finally { setRefreshing(false); } }
  if (loading && friends.length === 0) return <FriendsSkeleton />;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "top"]}>
      <FlatList data={visibleFriends} keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FriendCard friend={item} onPress={() => router.push({ pathname: ROUTES.USER_PROFILE, params: { id: item.id } } as never)} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
        contentContainerStyle={[styles.listContent, visibleFriends.length === 0 && styles.grow]}
        ListHeaderComponent={<>
          <ScreenHeader
            mode="menu"
            title={t("screen.title")}
            subtitle={t("screen.count", { count: friends.length })}
            rightIcon="person-add-outline"
            onRightPress={() => router.push(ROUTES.FRIEND_SEARCH as never)}
          />

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
            <TextInput value={query} onChangeText={setQuery} placeholder={t("screen.searchPlaceholder")} placeholderTextColor={COLORS.textMuted} style={styles.searchInput} autoCapitalize="none" />
            {!!query && <TouchableOpacity onPress={() => setQuery("")}><Ionicons name="close-circle" size={18} color={COLORS.textMuted} /></TouchableOpacity>}
          </View>

          <TouchableOpacity style={styles.requestsRow} activeOpacity={0.85} onPress={() => router.push(ROUTES.FRIEND_REQUESTS as never)}>
            <View style={styles.requestsIcon}><Ionicons name="people" size={18} color={COLORS.secondary} /></View>
            <Text style={styles.requestsText}>{t("screen.requests")}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} />
          </TouchableOpacity>

          <View style={styles.tabs}>
            {(["all", "mostPlayed", "recent"] as SortMode[]).map((value) => (
              <TouchableOpacity key={value} onPress={() => setSort(value)} style={[styles.tab, sort === value && styles.activeTab]}>
                <Text style={[styles.tabText, sort === value && styles.activeTabText]}>{t(`sort.${value}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!error && <Text style={styles.inlineError}>{error}</Text>}
        </>}
        ListEmptyComponent={<View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}><Ionicons name={query ? "search-outline" : "people-outline"} size={44} color={COLORS.primary} /></View>
          <Text style={styles.emptyTitle}>{t(query ? "screen.noResults" : "screen.emptyTitle")}</Text>
          <Text style={styles.emptyDescription}>{t(query ? "screen.noResultsDescription" : "screen.emptyDescription")}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => query ? setQuery("") : router.push(ROUTES.FRIEND_SEARCH as never)}>
            <Text style={styles.primaryButtonText}>{t(query ? "screen.clearSearch" : "screen.findFriends")}</Text>
          </TouchableOpacity>
        </View>}
      />
    </SafeAreaView>
  );
}

function FriendCard({ friend, onPress }: { friend: FriendLite; onPress: () => void }) {
  const colors = avatarColors(friend.userName);
  return (
    <TouchableOpacity style={styles.friendCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatarWrap}>
        {friend.profilePictureUrl ? (
          <Image source={{ uri: friend.profilePictureUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
            <Text style={[styles.avatarText, { color: colors.fg }]}>{friend.userName.trim().charAt(0).toUpperCase() || "?"}</Text>
          </View>
        )}
        {friend.isOnline && <OnlineDot />}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>{friend.userName}</Text>
        <Text style={styles.meta}>{friend.sharedMatchesCount} partidas juntos</Text>
        <Text style={styles.secondaryMeta} numberOfLines={1}>
          {friend.lastPlayedAt ? `Última: ${relativeDate(friend.lastPlayedAt)}` : friend.mostPlayedGame ? `Mais jogado: ${friend.mostPlayedGame}` : "Ainda sem partidas juntos"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function relativeDate(value: string) { const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)); return days === 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`; }
function FriendsSkeleton() {
  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "top"]}>
      <View style={styles.skeletonHeader} />
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={styles.skeletonLineWide} />
            <View style={styles.skeletonLine} />
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
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
  grow: { flexGrow: 1 },
  listContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },


  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 16, paddingHorizontal: 14, minHeight: 50, ...cardShadow },
  searchInput: { flex: 1, marginLeft: 10, color: COLORS.onBackground, fontSize: 15 },

  requestsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: `${COLORS.secondary}14` },
  requestsIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${COLORS.secondary}22` },
  requestsText: { flex: 1, marginLeft: 11, fontWeight: "700", color: COLORS.onBackground, fontSize: 14 },

  tabs: { flexDirection: "row", marginTop: 20, marginBottom: 4, backgroundColor: COLORS.surface, padding: 4, borderRadius: 13 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 10 },
  activeTab: { backgroundColor: COLORS.card, ...cardShadow, shadowOpacity: 0.08 },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "700" },
  activeTabText: { color: COLORS.primary },

  friendCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 18, padding: 14, marginTop: 12, ...cardShadow },
  avatarWrap: { marginRight: 13 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800" },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground },
  meta: { marginTop: 3, fontSize: 13, color: COLORS.onBackground },
  secondaryMeta: { marginTop: 2, fontSize: 12, color: COLORS.textMuted },
  inlineError: { color: COLORS.error, marginTop: 14 },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 48 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: `${COLORS.primary}12` },
  emptyTitle: { marginTop: 18, fontSize: 19, fontWeight: "800", color: COLORS.onBackground, textAlign: "center" },
  emptyDescription: { marginTop: 8, color: COLORS.textMuted, lineHeight: 20, textAlign: "center" },
  primaryButton: { marginTop: 20, backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 13 },
  primaryButtonText: { color: "#fff", fontWeight: "800" },

  skeletonHeader: { height: 72, margin: 18, borderRadius: 18, backgroundColor: COLORS.surface },
  skeletonCard: { flexDirection: "row", marginHorizontal: 18, marginBottom: 12, padding: 14, borderRadius: 18, backgroundColor: COLORS.card, ...cardShadow },
  skeletonAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surface },
  skeletonLines: { flex: 1, marginLeft: 13, justifyContent: "center" },
  skeletonLineWide: { height: 13, width: "60%", backgroundColor: COLORS.surface, borderRadius: 6 },
  skeletonLine: { height: 11, width: "42%", marginTop: 9, backgroundColor: COLORS.surface, borderRadius: 6 },
});