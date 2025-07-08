import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
} from "react-native";
import { useGameSuggestions } from "../hooks/useGameSuggestions";
import { useGameSearch } from "../hooks/useGameSearch";
import { Game } from "../types/Game";
import LottieView from "lottie-react-native";
import debounce from "lodash.debounce";

type Props = {
  onSelect: (game: Game) => void;
};

export const GameSelector = ({ onSelect }: Props) => {
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);

  const {
    suggestions,
    loading,
    fetchSuggestions,
    hasMore,
    resetSuggestions,
  } = useGameSuggestions("base");

  const { searchGame, loading: loadingSearch } = useGameSearch();

  const debouncedFetch = useRef(
    debounce((text: string) => {
      if (text.length >= 3) {
        fetchSuggestions(text);
      } else {
        resetSuggestions();
      }
    }, 400)
  ).current;

  const handleSelect = async (name: string) => {
    const game = await searchGame(name);
    if (game) {
      onSelect(game);
      setQuery("");
      resetSuggestions();
      setNotFound(false);
      Keyboard.dismiss();
    } else {
      setNotFound(true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && query.length >= 3) {
      fetchSuggestions(query);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="🔎 Search for a base game..."
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          debouncedFetch(text);
        }}
        style={styles.input}
        placeholderTextColor="#999"
      />

      {loading && suggestions.length === 0 && (
        <ActivityIndicator style={{ marginTop: 10 }} />
      )}

      {suggestions.length > 0 && (
        <View style={styles.card}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => `suggestion-${item.bggId}`}
            keyboardShouldPersistTaps="handled"
            scrollEnabled
            nestedScrollEnabled
            style={{ maxHeight: 200 }}
            contentContainerStyle={{ paddingBottom: 10 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item.name)}
                style={styles.item}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.image} />
                ) : (
                  <View style={styles.image}>
                    <LottieView
                      source={require("@/assets/animations/ghost.json")}
                      autoPlay
                      loop
                      style={styles.lottieGhost}
                    />
                  </View>
                )}

                <Text style={styles.itemText}>
                  {item.name}
                  {item.yearPublished ? ` (${item.yearPublished})` : ""}
                </Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={() =>
              loading && suggestions.length > 0 ? (
                <ActivityIndicator style={{ marginBottom: 8 }} />
              ) : null
            }
          />
        </View>
      )}

      {notFound && (
        <Text style={styles.notFound}>
          🚫 This game is not yet in MeepleBoard.
        </Text>
      )}

      {loadingSearch && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  card: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  image: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  lottieGhost: {
    width: 36,
    height: 36,
  },
  notFound: {
    color: "red",
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});
