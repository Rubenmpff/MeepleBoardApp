import i18n from "i18next";
import React, { useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, Card, EmptyState, Glyph, Row, Segmented } from "@/src/ui/components";
import { colors, radius, space, touch, type } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";
import { useFriends } from "../hooks/useFriends";
import { FriendLite } from "../services/friendshipService";
import OnlineDot from "../components/OnlineDot";
import ScreenState from "@/src/components/ui/ScreenState";
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
  // Reached from Perfil: a back header, with "add friend" on the right.
  const header = <ScreenHeader title={t("screen.title")} rightIcon="person-add-outline" rightAccessibilityLabel={t("screen.add")}
    onRightPress={() => router.push(ROUTES.FRIEND_SEARCH as never)} />;
  if (loading && friends.length === 0) return <SafeAreaView style={styles.screen}><View style={styles.pad}>{header}</View><ScreenState loading message={t("card.loading")} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "top"]}>
      <View style={styles.pad}>{header}</View>
      <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" data={visibleFriends} keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <View style={[styles.item, index === 0 && styles.itemFirst, index === visibleFriends.length - 1 && styles.itemLast]}>
          <Row first={index === 0} inset={72} strongTitle title={item.userName} lead={<FriendAvatar friend={item} />}
            subtitle={t("card.sharedMatches", { count: item.sharedMatchesCount })}
            detail={<Text style={type.caption} numberOfLines={1}>{item.lastPlayedAt ? t("card.lastPlayed", { date: relativeDate(item.lastPlayedAt) }) : item.mostPlayedGame ? t("card.mostPlayed", { game: item.mostPlayedGame }) : t("card.noMatches")}</Text>}
            accessibilityLabel={item.userName} onPress={() => router.push({ pathname: ROUTES.USER_PROFILE, params: { id: item.id } } as never)} />
        </View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.listContent, visibleFriends.length === 0 && styles.grow]}
        ListHeaderComponent={<View style={styles.headerBlock}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color={colors.placeholder} />
            <TextInput value={query} onChangeText={setQuery} accessibilityLabel={t("screen.searchPlaceholder")} placeholder={t("screen.searchPlaceholder")} placeholderTextColor={colors.placeholder} style={[type.body, styles.searchInput]} autoCapitalize="none" />
            {!!query && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("card.clearSearch")} style={styles.clear} onPress={() => setQuery("")}><Ionicons name="close-circle" size={18} color={colors.placeholder} /></TouchableOpacity>}
          </View>
          <Card>
            <Row first inset={52} title={t("screen.requests")} lead={<Glyph name="account-multiple-outline" size={22} color={colors.friend} />}
              onPress={() => router.push(ROUTES.FRIEND_REQUESTS as never)} />
          </Card>
          <View style={styles.sortRow}>
            <Text style={[type.head, styles.flex]} accessibilityRole="header">{t("screen.count", { count: friends.length })}</Text>
          </View>
          <Segmented items={(["all", "mostPlayed", "recent"] as SortMode[]).map(value => ({ key: value, label: t(`sort.${value}`) }))} value={sort} onChange={setSort} />
          {!!error && <ScreenState error message={error} onRetry={() => refetch(true)} retryLabel={t("screen.retry")} />}
        </View>}
        ListEmptyComponent={<EmptyState title={t(query ? "screen.noResults" : "screen.emptyTitle")} message={t(query ? "screen.noResultsDescription" : "screen.emptyDescription")}
          action={<Button variant="primary" title={t(query ? "screen.clearSearch" : "screen.findFriends")} onPress={() => query ? setQuery("") : router.push(ROUTES.FRIEND_SEARCH as never)} />} />}
      />
    </SafeAreaView>
  );
}

// Photo when there is one; otherwise the shared initial avatar. The online dot keeps its meaning.
function FriendAvatar({ friend }: { friend: FriendLite }) {
  return <View>
    {friend.profilePictureUrl ? <Image source={{ uri: friend.profilePictureUrl }} style={styles.photo} accessible={false} /> : <Avatar name={friend.userName} />}
    {friend.isOnline && <OnlineDot />}
  </View>;
}

function relativeDate(value: string) { const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)); return days === 0 ? i18n.t("friends:card.today") : days === 1 ? i18n.t("friends:card.yesterday") : i18n.t("friends:card.daysAgo", { count: days }); }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: space.lg },
  grow: { flexGrow: 1 },
  flex: { flex: 1, minWidth: 0 },
  listContent: { paddingHorizontal: space.lg, paddingBottom: 32 },
  headerBlock: { gap: space.lg, paddingTop: space.xs, paddingBottom: space.md },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.field, borderRadius: radius.control, paddingLeft: space.md },
  searchInput: { flex: 1, minHeight: touch, marginLeft: space.sm, color: colors.text },
  clear: { width: touch, height: touch, alignItems: "center", justifyContent: "center" },
  sortRow: { flexDirection: "row", alignItems: "center", marginTop: space.xs, paddingHorizontal: space.xs },
  // Rows of one card, split across FlatList items.
  item: { backgroundColor: colors.card, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line },
  itemFirst: { borderTopWidth: 1, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  itemLast: { borderBottomWidth: 1, borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  photo: { width: 40, height: 40, borderRadius: 20 },
});
