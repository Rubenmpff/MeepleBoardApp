import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import sessionService from "@/src/features/games/services/sessionService";
import { GameSession } from "@/src/features/games/types/GameSession";
import SessionAddMatchForm from "@/src/features/games/components/SessionAddMatchForm";
import { COLORS } from "@/src/constants/colors";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!id) return;
    try {
      const data = await sessionService.getById(id);
      setSession(data);
    } catch (error) {
      console.error("❌ Erro ao carregar sessão:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Sessão não encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session.name || "Sessão sem nome"}</Text>
      {session.location && <Text style={styles.subtitle}>📍 {session.location}</Text>}

      <SessionAddMatchForm sessionId={session.id} onSuccess={fetchSession} />

      <Text style={styles.sectionTitle}>Partidas desta sessão</Text>
      <FlatList
        data={session.matches}
        keyExtractor={(item, index) => item.id ?? index.toString()} // usa id da partida se existir
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <Text style={styles.matchGame}>{item.gameName}</Text>
            <Text style={styles.matchDetail}>
              🏆 Vencedor: {item.winnerId || "Sem vencedor"}
            </Text>
            {item.durationInMinutes && (
              <Text style={styles.matchDetail}>
                ⏱ {item.durationInMinutes} minutos
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma partida registada</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSession(); }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.onBackground, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 16 },
  matchCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  matchGame: { fontSize: 16, fontWeight: "bold", color: COLORS.onBackground },
  matchDetail: { fontSize: 14, color: "#555", marginTop: 4 },
  emptyText: { textAlign: "center", marginTop: 20, color: "#999" },
});
