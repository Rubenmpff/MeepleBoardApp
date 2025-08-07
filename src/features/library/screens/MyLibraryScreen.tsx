import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { GameCard } from "../components/GameCard";
import { COLORS } from "@/src/constants/colors";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { useUserLibrary } from "../hooks/useUserLibrary";
import { useUser } from "@/src/features/users/hooks/useUser";
import { useLibraryActions } from "@/src/features/library/hooks/useLibraryActions";

export default function MyLibraryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { library = [], loading, error, refetch } = useUserLibrary();
  const { removeGame } = useLibraryActions();

  const [activeFilter, setActiveFilter] = useState<"ALL" | GameLibraryStatus>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const filteredLibrary = useMemo(
    () =>
      activeFilter === "ALL"
        ? library
        : library.filter((g) => g.status === activeFilter),
    [library, activeFilter]
  );

  const counters = useMemo(() => {
    const owned = library.filter((g) => g.status === GameLibraryStatus.Owned);
    return {
      owned: owned.length,
      wishlist: library.filter((g) => g.status === GameLibraryStatus.Wishlist).length,
      played: library.filter((g) => g.status === GameLibraryStatus.Played).length,
      totalSpent: owned.reduce((sum, g) => sum + (g.pricePaid ?? 0), 0),
    };
  }, [library]);

  const handleRemoveGame = useCallback(
    (gameId: string) => {
      if (!user?.id) return console.warn("⚠️ handleRemoveGame: user.id is undefined.");

      Alert.alert(
        "Remover Jogo",
        "Tens a certeza que queres remover este jogo da tua biblioteca?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            style: "destructive",
            onPress: async () => {
              try {
                await removeGame(gameId);
              } catch (err) {
                console.error("❌ Failed to remove game:", err);
              }
            },
          },
        ]
      );
    },
    [user?.id, removeGame]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = ({ item, index }: any) => (
    <AnimatedGameCard
      index={index}
      game={item.game}
      status={item.status}
      pricePaid={item.pricePaid}
      onRemove={() => handleRemoveGame(item.gameId)}
    />
  );

  if (loading && library.length === 0) {
    return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🎲 My Library</Text>
        <TouchableOpacity style={styles.addGameBtn} onPress={() => router.push("/games/search")}>
          <Ionicons name="add-outline" size={18} color="#fff" />
          <Text style={styles.addGameText}>Add Game</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <Stat label="In Collection" value={counters.owned} icon="albums-outline" />
        <Stat label="Wishlist" value={counters.wishlist} icon="heart-outline" />
        <Stat label="Played" value={counters.played} icon="game-controller-outline" />
      </View>

      <Text style={styles.totalSpent}>
        💰 Total Spent: <Text style={styles.totalSpentValue}>€{counters.totalSpent.toFixed(2)}</Text>
      </Text>

      <FilterBar active={activeFilter} onChange={setActiveFilter} />

      {filteredLibrary.length === 0 ? (
        <Text style={styles.empty}>No games found for this filter.</Text>
      ) : (
        <FlatList
          data={filteredLibrary}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const AnimatedGameCard = ({ index, game, status, pricePaid, onRemove }: any) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {game ? (
        <GameCard game={game} status={status} pricePaid={pricePaid} onRemove={onRemove} />
      ) : (
        <Text style={styles.error}>Invalid game entry</Text>
      )}
    </Animated.View>
  );
};

const FilterBar = ({ active, onChange }: { active: "ALL" | GameLibraryStatus; onChange: (v: "ALL" | GameLibraryStatus) => void; }) => {
  const items = [
    { label: "All", value: "ALL" as const, icon: "grid-outline" },
    { label: "Collection", value: GameLibraryStatus.Owned, icon: "albums-outline" },
    { label: "Wishlist", value: GameLibraryStatus.Wishlist, icon: "heart-outline" },
    { label: "Played", value: GameLibraryStatus.Played, icon: "game-controller-outline" },
  ];

  return (
    <View style={styles.filterRow}>
      {items.map((it, idx) => {
        const isActive = active === it.value;
        return (
          <TouchableOpacity
            key={`${it.value}-${idx}`}
            style={[styles.filterBtn, isActive && styles.filterBtnActive]}
            onPress={() => onChange(it.value)}
          >
            <Ionicons
              name={it.icon as any}
              size={16}
              color={isActive ? "#fff" : COLORS.onBackground}
            />
            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const Stat = ({ label, value, icon }: { label: string; value: number; icon: string }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon as any} size={18} color={COLORS.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.primary },
  addGameBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  addGameText: { color: "#fff", fontWeight: "600" },
  loader: { marginTop: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8, marginTop: 8 },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.onBackground },
  totalSpent: { fontSize: 16, fontWeight: "500", color: COLORS.onBackground, textAlign: "center", marginBottom: 12 },
  totalSpentValue: { fontWeight: "bold", color: COLORS.secondary },
  filterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.onBackground },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 16, color: "#888" },
  error: { color: COLORS.error, fontSize: 16, textAlign: "center" },
  retryBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "bold" },
});
