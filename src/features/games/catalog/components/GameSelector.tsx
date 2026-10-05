import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import debounce from "lodash.debounce";
import LottieView from "lottie-react-native";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";
import { useGameSearch } from "../hooks/useGameSearch";
import { useGameSuggestions } from "../hooks/useGameSuggestions";
import { Game } from "../types/Game";

type Props = {
  onSelect: (game: Game) => void;
};

export const GameSelector = ({ onSelect }: Props) => {
  const { t } = useTranslation("games");
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

  const debouncedFetch = useMemo(
    () =>
      debounce((text: string) => {
        const normalized = text.trim();

        if (normalized.length >= 3) {
          fetchSuggestions(normalized, true);
        } else {
          resetSuggestions();
        }
      }, 400),
    [fetchSuggestions, resetSuggestions]
  );

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  async function handleSelect(name: string) {
    const game = await searchGame(name);

    if (!game) {
      setNotFound(true);
      return;
    }

    onSelect(game);
    setQuery("");
    resetSuggestions();
    setNotFound(false);
    Keyboard.dismiss();
  }

  function handleLoadMore() {
    if (!loading && hasMore && query.trim().length >= 3) {
      fetchSuggestions(query.trim());
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={t("selector.placeholder")}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setNotFound(false);
          debouncedFetch(text);
        }}
        style={styles.input}
        placeholderTextColor={COLORS.textMuted}
        autoCorrect={false}
      />

      {loading && suggestions.length === 0 && (
        <ActivityIndicator
          style={styles.loader}
          color={COLORS.primary}
        />
      )}

      {suggestions.length > 0 && (
        <View style={styles.card}>
          <ScrollView
            style={styles.results}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            onScroll={({ nativeEvent }) => {
              const {
                layoutMeasurement,
                contentOffset,
                contentSize,
              } = nativeEvent;

              if (
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 20
              ) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={200}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={`suggestion-${item.bggId}`}
                onPress={() => {
                  void handleSelect(item.name);
                }}
                style={styles.item}
                accessibilityRole="button"
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                  />
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
                  {item.yearPublished
                    ? ` (${item.yearPublished})`
                    : ""}
                </Text>
              </TouchableOpacity>
            ))}

            {loading && suggestions.length > 0 && (
              <ActivityIndicator
                style={styles.footerLoader}
                color={COLORS.primary}
              />
            )}
          </ScrollView>
        </View>
      )}

      {notFound && (
        <Text style={styles.notFound}>{t("selector.notFound")}</Text>
      )}

      {loadingSearch && (
        <ActivityIndicator
          style={styles.loader}
          color={COLORS.primary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    color: COLORS.onBackground,
  },
  loader: { marginTop: 10 },
  card: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  results: { maxHeight: 200 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onBackground,
  },
  image: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieGhost: { width: 36, height: 36 },
  footerLoader: { marginBottom: 8, marginTop: 4 },
  notFound: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});
