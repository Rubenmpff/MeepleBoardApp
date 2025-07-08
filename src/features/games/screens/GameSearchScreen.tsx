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
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";

export default function GameSearchScreen() {
  /* ────────── Local state */
  const [query, setQuery]           = useState("");
  const [selectedGame, setSelected] = useState<Game | null>(null);
  const [addVisible, setAddVis]     = useState(false);
  const [manageVisible, setMngVis]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* ────────── Suggestions */
  const {
    suggestions,
    loading: loadingSuggestions,
    fetchSuggestions,
    hasMore,
    resetSuggestions,
  } = useGameSuggestions("all");

  /* ────────── Library */
  const { library, refetch }               = useUserLibrary();
  const { addGameByName, loading: adding } = useAddGameToLibrary();
  const { removeGame }                     = useRemoveGameFromLibrary();

  /* ────────── Debounce */
  const lastQueryRef = useRef("");
  const debouncedFetch = useRef(
    debounce((text: string) => {
      const n = text.trim().toLowerCase();
      if (n.length < 3) {
        resetSuggestions();
        lastQueryRef.current = "";
        return;
      }

      const isNew = n !== lastQueryRef.current;
      if (!loadingSuggestions) {
        fetchSuggestions(n, isNew);
        lastQueryRef.current = n;
      }
    }, 600)
  ).current;

  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  /* ────────── Cleanup on blur */
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setQuery("");
        resetSuggestions();
        lastQueryRef.current = "";
        debouncedFetch.cancel();
        setSelected(null);
        setAddVis(false);
        setMngVis(false);
      };
    }, [])
  );

  /* ────────── Helpers */
  const isSameGame = (e: any, g: Game) =>
    (e.gameId && g.id && e.gameId === g.id) ||
    (e.game?.bggId && g.bggId && e.game.bggId === g.bggId) ||
    e.gameName?.toLowerCase() === g.name.toLowerCase();

  const isInLibrary = (g: Game) => library.some((e) => isSameGame(e, g));
  const getEntry    = (g: Game) => library.find((e) => isSameGame(e, g));
  const libTools    = useMemo(() => ({ isInLibrary, getEntry }), [library]);

  /* ────────── Handlers */
  const handleTextChange = (t: string) => {
    setQuery(t);
    if (t.trim().length < 3) {
      resetSuggestions();
      lastQueryRef.current = "";
      return;
    }
    debouncedFetch(t);
  };

  const onEndReachedCalledDuringMomentum = useRef(false);
  const handleEndReached = () => {
    if (
      !loadingSuggestions &&
      hasMore &&
      query.trim().length >= 3 &&
      !onEndReachedCalledDuringMomentum.current
    ) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchSuggestions(query);
    }
  };

  /* Reinicia flag de scroll quando query ou resultados mudam */
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
    setAddVis(false);
    setMngVis(false);
    setSelected(null);
  };

  /* ────────── Render */
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="🔍 Search for a board game…"
        value={query}
        onChangeText={handleTextChange}
        style={styles.input}
        placeholderTextColor="#999"
      />

      {loadingSuggestions && suggestions.length === 0 && query.trim().length >= 3 && (
        <Text style={styles.searchingText}>🔍 A procurar…</Text>
      )}

      {loadingSuggestions && suggestions.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(it) =>
            it.bggId ? String(it.bggId) : `${it.name}-${it.yearPublished ?? "?"}`
          }
          renderItem={({ item }) => {
            const game = item as Game;
            const added = libTools.isInLibrary(game);
            return (
              <GameListItem
                game={game}
                inLibrary={added}
                onPress={() => router.push(`/games/details/${game.bggId}`)}
                onAdd={() => { setSelected(game); setAddVis(true); }}
                onManageLibrary={() => { setSelected(game); setMngVis(true); }}
              />
            );
          }}
          /* Infinite scroll */
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.8}
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum.current = false;
          }}
          /* Pull-to-refresh */
          refreshing={refreshing}
          onRefresh={handleRefresh}
          /* Layout fix para listas curtas */
          contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
          scrollEventThrottle={16}
          initialNumToRender={10}
          /* Loader no fim da paginação */
          ListFooterComponent={
            loadingSuggestions && suggestions.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.primary} />
            ) : null
          }
          /* Mensagem “no results” correcta */
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
      )}

      {adding && (
        <ActivityIndicator
          style={{ position: "absolute", bottom: 20, alignSelf: "center" }}
          color={COLORS.primary}
        />
      )}

      {/* Modals */}
      {selectedGame && !libTools.isInLibrary(selectedGame) && (
        <AddToLibraryModal
          visible={addVisible}
          onClose={closeAll}
          onSubmit={(status, price) =>
            addGameByName(selectedGame.name, status, price)
              .then(refetch)
              .finally(closeAll)
          }
        />
      )}
      {selectedGame && libTools.isInLibrary(selectedGame) && (
        <ManageLibraryEntryModal
          visible={manageVisible}
          onClose={closeAll}
          gameName={selectedGame.name}
          currentStatus={
            libTools.getEntry(selectedGame)?.status ?? GameLibraryStatus.Owned
          }
          onRemove={() => {
            const entry = libTools.getEntry(selectedGame);
            if (!entry) return closeAll();
            removeGame(entry.gameId).then(refetch).finally(closeAll);
          }}
          onUpdateStatus={() => closeAll()}
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
