import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { GameCard } from "../components/GameCard";
import { COLORS } from "@/src/constants/colors";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { useUserLibrary } from "../hooks/useUserLibrary";
import { useUser } from "@/src/features/users/hooks/useUser";
import libraryService from "../services/libraryService";

export default function MyLibraryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { library = [], loading, error, refetch } = useUserLibrary();

  const [activeFilter, setActiveFilter] = useState<"ALL" | GameLibraryStatus>("ALL");

  const filteredLibrary = useMemo(() => {
    if (activeFilter === "ALL") return library;
    return library.filter((g) => g.status === activeFilter);
  }, [library, activeFilter]);

  const counters = useMemo(() => ({
    owned: library.filter((g) => g.status === GameLibraryStatus.Owned).length,
    wishlist: library.filter((g) => g.status === GameLibraryStatus.Wishlist).length,
    played: library.filter((g) => g.status === GameLibraryStatus.Played).length,
  }), [library]);

  const handleRemoveGame = async (libraryEntryId: string, gameId: string) => {
    if (!user?.id) {
      console.warn("⚠️ handleRemoveGame: user.id is undefined.");
      return;
    }

    Alert.alert(
      "Remove Game",
      "Are you sure you want to remove this game from your library?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`🗑️ Removing game [${gameId}] for user [${user.id}]`);
              await libraryService.removeGameFromLibrary(user.id, gameId);
              console.log("✅ Game removed.");
              await refetch();
            } catch (err) {
              console.error("❌ Failed to remove game:", err);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎲 My Library</Text>
        <TouchableOpacity onPress={() => router.push("/games/search")}>
          <Text style={styles.addLink}>+ Add Game</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Stat label="In Collection" value={counters.owned} />
        <Stat label="Wishlist" value={counters.wishlist} />
        <Stat label="Played" value={counters.played} />
      </View>

      {/* Filter Bar */}
      <FilterBar active={activeFilter} onChange={setActiveFilter} />

      {/* Game List */}
      {filteredLibrary.length === 0 ? (
        <Text style={styles.empty}>No games found for this filter.</Text>
      ) : (
        <FlatList
          data={filteredLibrary}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (!item.game) {
              console.warn("⚠️ Item with missing game:", item);
              return null;
            }

            return (
              <GameCard
                game={item.game}
                status={item.status}
                onRemove={() => handleRemoveGame(item.id, item.gameId)}
              />
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- Subcomponents ---------- */

const FilterBar = ({
  active,
  onChange,
}: {
  active: "ALL" | GameLibraryStatus;
  onChange: (v: "ALL" | GameLibraryStatus) => void;
}) => {
  const items = [
    { label: "All", value: "ALL" as const },
    { label: "Collection", value: GameLibraryStatus.Owned },
    { label: "Wishlist", value: GameLibraryStatus.Wishlist },
    { label: "Played", value: GameLibraryStatus.Played },
  ];

  return (
    <View style={styles.filterRow}>
      {items.map((it) => (
        <TouchableOpacity
          key={String(it.value)}
          style={[styles.filterBtn, active === it.value && styles.filterBtnActive]}
          onPress={() => onChange(it.value)}
        >
          <Text
            style={[styles.filterText, active === it.value && styles.filterTextActive]}
          >
            {it.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  addLink: {
    fontSize: 14,
    color: COLORS.primary,
  },
  loader: { marginTop: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    marginTop: 8,
  },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.onBackground },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: { fontSize: 12, color: COLORS.onBackground },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#888",
  },
  error: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: "center",
  },
});
