import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Animated } from "react-native";
import { Game } from "@/src/features/games/types/Game";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { COLORS } from "@/src/constants/colors";

interface Props {
  game?: Game;
  status: GameLibraryStatus;
  pricePaid?: number;
  onRemove?: () => void;
}

export function GameCard({ game, status, pricePaid, onRemove }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!game) {
    console.warn("⚠️ GameCard received undefined game:", { status });
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={[styles.title, styles.errorText]}>⚠️ Game not loaded</Text>
        <Text style={styles.status}>Status: {getStatusLabel(status)}</Text>
      </View>
    );
  }

  const handleRemove = () => {
    Alert.alert(
      "Remove Game",
      `Do you want to remove "${game.name}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: onRemove,
        },
      ]
    );
  };

  const borderColor = pricePaid === 0 ? COLORS.success : pricePaid ? COLORS.secondary : "#ccc";

  return (
    <Animated.View style={[styles.card, { borderColor, opacity: fadeAnim }]}>
      {game.imageUrl ? (
        <Image source={{ uri: game.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>🎲</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {game.name}
        </Text>
        {game.yearPublished && <Text style={styles.subtitle}>Year: {game.yearPublished}</Text>}
        <Text style={styles.status}>Status: {getStatusLabel(status)}</Text>
        {typeof pricePaid === "number" && (
          <Text style={styles.price}>
            {pricePaid > 0 ? `Price Paid: €${pricePaid.toFixed(2)}` : "Offered (0€)"}
          </Text>
        )}
        {onRemove && (
          <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
            <Text style={styles.removeText}>🗑 Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

function getStatusLabel(status: GameLibraryStatus): string {
  switch (status) {
    case GameLibraryStatus.Owned:
      return "Owned";
    case GameLibraryStatus.Played:
      return "Played";
    case GameLibraryStatus.Wishlist:
      return "Wishlist";
    default:
      return "Unknown";
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2, // <--- para destacar borda
  },
  errorCard: {
    backgroundColor: "#ffe6e6",
  },
  errorText: {
    color: COLORS.error,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: COLORS.surface,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 28,
    color: "#bbb",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.onBackground,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  status: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: "600",
  },
  removeBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  removeText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: "bold",
  },
});
