// src/features/games/screens/GameSearchScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import debounce from "lodash.debounce";
import { router, useFocusEffect } from "expo-router";

import { COLORS } from "@/src/constants/colors";
import { useGameSuggestions } from "../hooks/useGameSuggestions";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { useAddGameToLibrary } from "@/src/features/library/hooks/useAddGameToLibrary";
import { useRemoveGameFromLibrary } from "@/src/features/library/hooks/useRemoveGameFromLibrary";

import { GameListItem } from "../components/GameListItem";
import AddToLibraryModal from "@/src/features/library/components/AddToLibraryModal";
import ManageLibraryEntryModal from "@/src/features/library/components/ManageLibraryEntryModal";

import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";

export default function GameSearchScreen() {
  const [query, setQuery] = useState("");
  const [selectedGame, setSelected] = useState<Game | null>(null);
  const [addVisible, setAddVisible] = useState(false);
  const [manageVisible, setManageVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    suggestions,
    loading: loadingSuggestions,
    fetchSuggestions,
    hasMore,
    resetSuggestions,
  } = useGameSuggestions("all");

  const { library, refetch } = useUserLibrary();
  const { addGame, loading: adding } = useAddGameToLibrary();
  const { removeGame } = useRemoveGameFromLibrary();

  const lastQueryRef = useRef("");
  const debouncedFetch = useRef(
    debounce((text: string) => {
      const normalized = text.trim().toLowerCase();
      if (normalized.length < 3) {
        resetSuggestions();
        lastQueryRef.current = "";
        return;
      }
      if (!loadingSuggestions && normalized !== lastQueryRef.current) {
        fetchSuggestions(normalized, true);
        lastQueryRef.current = normalized;
      }
    }, 600)
  ).current;

  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setQuery("");
        resetSuggestions();
        lastQueryRef.current = "";
        debouncedFetch.cancel();
        setSelected(null);
        setAddVisible(false);
        setManageVisible(false);
      };
    }, [])
  );

  const isSameGame = (entry: any, game: Game | GameSuggestion) => {
    const entryId = entry.gameId ?? entry.game?.id ?? "";
    const entryBggId = entry.bggId ?? entry.game?.bggId ?? undefined;
    const gameId = game.id ?? "";
    const gameBggId = game.bggId ?? undefined;
    return (entryId && gameId && entryId === gameId) || (entryBggId && gameBggId && entryBggId === gameBggId);
  };

  const isInLibrary = (g: Game | GameSuggestion) => library.some((e) => isSameGame(e, g));
  const getEntry = (g: Game | GameSuggestion) => library.find((e) => isSameGame(e, g));
  const libTools = useMemo(() => ({ isInLibrary, getEntry }), [library]);

  const handleTextChange = (t: string) => {
    setQuery(t);
    if (t.trim().length < 3) {
      resetSuggestions();
      lastQueryRef.current = "";
    } else {
      debouncedFetch(t);
    }
  };

  const onEndReachedCalledDuringMomentum = useRef(false);
  const handleEndReached = () => {
    if (!loadingSuggestions && hasMore && query.trim().length >= 3 && !onEndReachedCalledDuringMomentum.current) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchSuggestions(query);
    }
  };

  useEffect(() => {
    onEndReachedCalledDuringMomentum.current = false;
  }, [suggestions, query]);

  const handleRefresh = async () => {
    const q = query.trim();
    if (q.length < 3) return;
    setRefreshing(true);
    await fetchSuggestions(q, true);
    setRefreshing(false);
  };

  const closeAll = () => {
    setAddVisible(false);
    setManageVisible(false);
    setSelected(null);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="🔍 Search for a board game…"
        value={query}
        onChangeText={handleTextChange}
        style={styles.input}
        placeholderTextColor="#999"
      />

      {loadingSuggestions && suggestions.length === 0 && query.trim().length >= 3 ? (
        <Text style={styles.searchingText}>🔍 A procurar…</Text>
      ) : null}

      <FlatList
        data={suggestions}
        keyExtractor={(it) => (it.bggId ? String(it.bggId) : `${it.name}-${it.yearPublished ?? "?"}`)}
        renderItem={({ item }) => (
          <GameListItem
            game={item}
            inLibrary={libTools.isInLibrary(item)}
            onPress={() => router.push(`/games/details/${item.bggId}`)}
            onAdd={() => {
              setSelected(item as Game);
              setAddVisible(true);
            }}
            onManageLibrary={() => {
              setSelected(item as Game);
              setManageVisible(true);
            }}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        onMomentumScrollBegin={() => (onEndReachedCalledDuringMomentum.current = false)}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        scrollEventThrottle={16}
        initialNumToRender={10}
        ListFooterComponent={
          loadingSuggestions && suggestions.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={
          query.trim().length >= 3 &&
          !loadingSuggestions &&
          suggestions.length === 0 &&
          lastQueryRef.current === query.trim().toLowerCase() ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No games found for this search.</Text>
            </View>
          ) : null
        }
      />

      {selectedGame && !libTools.isInLibrary(selectedGame) && addVisible && (
        <AddToLibraryModal visible onClose={closeAll} game={selectedGame} />
      )}

      {selectedGame && libTools.isInLibrary(selectedGame) && manageVisible && (
        <ManageLibraryEntryModal visible onClose={closeAll} game={selectedGame} />
      )}

      {adding && (
        <ActivityIndicator
          style={{ position: "absolute", bottom: 20, alignSelf: "center" }}
          color={COLORS.primary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  emptyBox: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#888" },
  searchingText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
  },
});
