import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
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
      setLoading(true);
      const data = await sessionService.getById(id);
      setSession(data);
    } catch (error: any) {
      console.error("❌ Erro ao carregar sessão:", error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar os detalhes da sessão. Verifica a tua ligação."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const matches = useMemo(() => session?.matches ?? [], [session]);

  // --- Loading inicial
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- Sessão não encontrada
  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Sessão não encontrada.</Text>
      </View>
    );
  }

  const ListHeader = (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{session.name || "Sessão sem nome"}</Text>

        {!!session.location && (
          <Text style={styles.subtitle}>📍 {session.location}</Text>
        )}

        <Text
          style={[
            styles.status,
            { color: session.isActive ? COLORS.success : "#999" },
          ]}
        >
          {session.isActive ? "Ativa" : "Encerrada"}
        </Text>
      </View>

      {/* Form */}
      {session.isActive ? (
        <View style={styles.formWrap}>
          <SessionAddMatchForm sessionId={session.id} onSuccess={fetchSession} />
        </View>
      ) : (
        <Text style={styles.infoText}>
          ⚠️ Esta sessão foi encerrada. Não é possível adicionar novas partidas.
        </Text>
      )}

      {/* Matches title */}
      <Text style={styles.sectionTitle}>Partidas desta sessão</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={matches}
      keyExtractor={(item, index) => item.id ?? index.toString()}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
        <View style={styles.matchCard}>
          <Text style={styles.matchGame}>{item.gameName}</Text>

          {/* ⚠️ Por agora estás a mostrar winnerId (vamos melhorar no passo 3) */}
          <Text style={styles.matchDetail}>
            🏆 Vencedor: {item.winnerId || "Sem vencedor"}
          </Text>

          {!!item.durationInMinutes && (
            <Text style={styles.matchDetail}>⏱ {item.durationInMinutes} minutos</Text>
          )}
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>Nenhuma partida registada.</Text>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSession();
          }}
          colors={[COLORS.primary]}
        />
      }
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },

  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.onBackground, marginTop: 4 },
  status: { fontSize: 14, marginTop: 4, fontWeight: "600" },

  formWrap: { marginBottom: 8 },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 16 },

  infoText: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

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
