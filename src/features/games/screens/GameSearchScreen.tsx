import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Text,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";
import { useGameSuggestions } from "../hooks/useGameSuggestions";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { useLibraryActions } from "@/src/features/library/hooks/useLibraryActions";

import { GameListItem } from "../components/GameListItem";
import AddToLibraryModal from "@/src/features/library/components/AddToLibraryModal";
import ManageLibraryEntryModal from "@/src/features/library/components/ManageLibraryEntryModal";

import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";
import { normalizeToGame } from "../utils/normalizeToGame";
import { UserGameLibrary } from "@/src/features/library/types/UserGameLibrary";
import gameService from "../services/gameService";

const logPrefix = "📚 [GameSearchScreen]";
const logInfo = (msg: string, data?: any) =>
  __DEV__ && console.log(`${logPrefix} ℹ️ ${msg}`, data ?? "");
const logWarn = (msg: string, data?: any) =>
  __DEV__ && console.warn(`${logPrefix} ⚠️ ${msg}`, data ?? "");
const logError = (msg: string, data?: any) =>
  __DEV__ && console.error(`${logPrefix} ❌ ${msg}`, data ?? "");

export default function GameSearchScreen() {
  const [query, setQuery] = useState("");
  const [selectedGame, setSelected] = useState<Game | GameSuggestion | null>(
    null
  );
  const [addVisible, setAddVisible] = useState(false);
  const [manageVisible, setManageVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [waitingForSearch, setWaitingForSearch] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    suggestions,
    loading: loadingSuggestions,
    fetchSuggestions,
    hasMore,
    resetSuggestions,
  } = useGameSuggestions("all");

  const { library } = useUserLibrary();
  const { addGame, loading: updatingLibrary } = useLibraryActions();

  const lastQueryRef = useRef("");

  const isSameGame = useCallback(
    (entry: UserGameLibrary, game: Game | GameSuggestion) => {
      const entryGameId = entry.gameId ?? entry.game?.id ?? "";
      const entryBggId = entry.bggId ?? entry.game?.bggId ?? "";
      const gameId = "id" in game ? game.id ?? "" : "";
      const gameBggId = game.bggId ?? "";
      return (
        (entryGameId && gameId && entryGameId === gameId) ||
        (entryBggId && gameBggId && entryBggId === gameBggId)
      );
    },
    []
  );

  const isInLibrary = useCallback(
    (g: Game | GameSuggestion) => library.some((e) => isSameGame(e, g)),
    [library, isSameGame]
  );

  /** Limpa estado ao sair da tela */
  useFocusEffect(
    useCallback(() => {
      return () => {
        logInfo("Saindo da tela, limpando estado");
        setQuery("");
        resetSuggestions();
        lastQueryRef.current = "";
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setSelected(null);
        setAddVisible(false);
        setManageVisible(false);
      };
    }, [])
  );

  /** Pesquisa com atraso (2s após parar de digitar) */
  const handleTextChange = (t: string) => {
    setQuery(t);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (t.trim().length < 1) {
      resetSuggestions();
      lastQueryRef.current = "";
      logWarn("Query menor que 1 caractere");
      return;
    }

    // Mostra "A procurar..." enquanto o user ainda está digitando
    setWaitingForSearch(true);

    typingTimeoutRef.current = setTimeout(() => {
      logInfo(`Buscando sugestões para: "${t.trim().toLowerCase()}"`);
      fetchSuggestions(t.trim().toLowerCase(), true);
      lastQueryRef.current = t.trim().toLowerCase();
      setWaitingForSearch(false);
    }, 2000);
  };

  const handleEndReached = () => {
    if (!loadingSuggestions && hasMore && query.trim().length >= 1) {
      logInfo("Carregar mais resultados…");
      fetchSuggestions(query);
    }
  };

  const handleRefresh = async () => {
    if (query.trim().length < 1) return;
    setRefreshing(true);
    logInfo("Refresh lista de resultados");
    await fetchSuggestions(query, true);
    setRefreshing(false);
  };

  const handleAddToLibrary = async () => {
    if (!selectedGame) return;
    const normalized = normalizeToGame(selectedGame);
    logInfo("Adicionando jogo à biblioteca", normalized);

    try {
      await addGame(normalized);
    } catch (error) {
      logError("Erro ao adicionar jogo", error);
    } finally {
      closeAll();
    }
  };

  const closeAll = () => {
    logInfo("Fechando modais");
    setAddVisible(false);
    setManageVisible(false);
    setSelected(null);
  };

  /** Importa automaticamente se necessário */
  const ensureImportedId = async (game: Game | GameSuggestion) => {
    if ("id" in game && game.id) return game.id;
    if (game.bggId) {
      const imported = await gameService.importByBggId(game.bggId);
      return imported?.id ?? "";
    }
    return "";
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

      {(waitingForSearch || (loadingSuggestions && suggestions.length === 0)) &&
        query.trim().length >= 1 && (
          <Text style={styles.searchingText}>🔍 A procurar…</Text>
        )}

      <FlatList
        data={suggestions}
        extraData={suggestions.map((x) => x.bggId || x.id)}
        keyExtractor={(it, index) => {
          const key =
            it.bggId != null
              ? `bgg-${it.bggId}`
              : it.id != null
              ? `id-${it.id}`
              : `temp-${index}-${Math.random()}`;
          return key;
        }}
        renderItem={({ item }) => (
          <GameListItem
            game={item}
            inLibrary={isInLibrary(item)}
            onPress={async () => {
              try {
                setRefreshing(true);
                const localId = await ensureImportedId(item);
                if (!localId) {
                  alert("Não foi possível abrir os detalhes do jogo.");
                  return;
                }
                router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: localId } });

              } finally {
                setRefreshing(false);
              }
            }}
            onAdd={async () => {
              try {
                setRefreshing(true);
                const localId = await ensureImportedId(item);
                if (!localId) {
                  alert("Não foi possível importar o jogo.");
                  return;
                }
                const normalized = normalizeToGame({ ...item, id: localId });
                await addGame(normalized);
              } catch (error) {
                logError("Erro ao adicionar jogo", error);
              } finally {
                setRefreshing(false);
              }
            }}
            onManageLibrary={() => {
              setSelected(item);
              setManageVisible(true);
            }}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        scrollEventThrottle={16}
        initialNumToRender={10}
        removeClippedSubviews={false}
        ListFooterComponent={
          loadingSuggestions && suggestions.length > 0 ? (
            <ActivityIndicator
              style={{ marginVertical: 16 }}
              color={COLORS.primary}
            />
          ) : null
        }
        ListEmptyComponent={
          query.trim().length >= 1 &&
          !loadingSuggestions &&
          suggestions.length === 0 &&
          lastQueryRef.current === query.trim().toLowerCase() ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No games found for this search.
              </Text>
            </View>
          ) : null
        }
      />

      {selectedGame && !isInLibrary(selectedGame) && addVisible && (
        <AddToLibraryModal
          visible
          onClose={closeAll}
          game={selectedGame}
          onAddToLibrary={handleAddToLibrary}
        />
      )}

      {selectedGame && isInLibrary(selectedGame) && manageVisible && (
        <ManageLibraryEntryModal
          visible
          onClose={closeAll}
          game={selectedGame}
        />
      )}

      {(refreshing || updatingLibrary) && (
        <Modal transparent animationType="fade">
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </Modal>
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
    color: COLORS.primary,
    fontStyle: "italic",
    marginBottom: 12,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
