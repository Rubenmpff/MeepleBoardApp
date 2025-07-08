import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import { Game } from "@/src/features/games/types/Game";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";

interface Props {
  game?: Game;                          // 🔹 Game to display
  status: GameLibraryStatus;           // 🔹 Library status
  onRemove?: () => void;               // 🔹 Optional remove callback
}

export function GameCard({ game, status, onRemove }: Props) {
  if (!game) {
    console.warn("⚠️ GameCard received undefined game:", { status });
    return (
      <View style={[styles.card, { backgroundColor: "#ffe6e6" }]}>
        <Text style={[styles.title, { color: "#900" }]}>⚠️ Game not loaded</Text>
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
          onPress: () => {
            console.log("🗑️ Removing game:", game.name);
            onRemove?.();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Game image */}
      {game.imageUrl && (
        <Image source={{ uri: game.imageUrl }} style={styles.image} />
      )}

      {/* Game details */}
      <View style={styles.info}>
        <Text style={styles.title}>{game.name}</Text>

        {game.yearPublished && (
          <Text style={styles.subtitle}>Year: {game.yearPublished}</Text>
        )}

        <Text style={styles.status}>Status: {getStatusLabel(status)}</Text>

        {onRemove && (
          <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
            <Text style={styles.removeText}>🗑️ Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 4,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  status: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  removeBtn: {
    marginTop: 8,
  },
  removeText: {
    fontSize: 13,
    color: "#c00",
  },
});
