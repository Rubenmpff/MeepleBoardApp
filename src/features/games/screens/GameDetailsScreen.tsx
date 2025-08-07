import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import gameService from "../services/gameService";
import { Game } from "../types/Game";
import { COLORS } from "@/src/constants/colors";

export default function GameDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const data = await gameService.getById(id);
        setGame(data);
      } catch (error) {
        console.error("Erro ao carregar jogo", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [id]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!game) return <Text style={styles.notFound}>Jogo não encontrado</Text>;

  return (
    <ScrollView style={styles.container}>
      {game.imageUrl && (
        <Image source={{ uri: game.imageUrl }} style={styles.image} />
      )}

      <Text style={styles.title}>{game.name}</Text>

      <View style={styles.metaRow}>
        {game.yearPublished && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Ano: {game.yearPublished}</Text>
          </View>
        )}
        {game.averageRating && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              ⭐ {game.averageRating.toFixed(1)}
            </Text>
          </View>
        )}
        {game.averageWeight && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              ⚖️ {game.averageWeight.toFixed(1)}
            </Text>
          </View>
        )}
        {game.minPlayers && game.maxPlayers && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              👥 {game.minPlayers}-{game.maxPlayers}
            </Text>
          </View>
        )}
      </View>

      {game.description && (
        <>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>{game.description}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  notFound: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.error,
    fontSize: 18,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    color: COLORS.onBackground,
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onBackground,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.onBackground,
    textAlign: "justify",
  },
});
