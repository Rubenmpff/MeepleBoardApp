import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/constants/colors";
import { useGameSessions } from "../hooks/useGameSessions";
import { ROUTES } from "@/src/constants/routes";
import { GameSession } from "../types/GameSession";

export default function GameSessionsScreen() {
  const router = useRouter();
  const { sessions, loading, createSession, closeSession } = useGameSessions();
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const session = await createSession(newName, newLocation);
      if (session) {
        setNewName("");
        setNewLocation("");
        router.push({
          pathname: ROUTES.SESSION_DETAIL,
          params: { id: session.id },
        });
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar a sessão.");
    } finally {
      setCreating(false);
    }
  };

  const handleCloseSession = async (id: string) => {
    try {
      await closeSession(id);
    } catch {
      Alert.alert("Erro", "Não foi possível fechar a sessão.");
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: GameSession }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: ROUTES.SESSION_DETAIL,
            params: { id: item.id },
          })
        }
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name ?? "Sessão sem nome"}</Text>
          {item.location && (
            <Text style={styles.cardSubtitle}>📍 {item.location}</Text>
          )}
          <Text style={styles.cardStatus}>
            {item.isActive ? "Ativa" : "Encerrada"}
          </Text>
        </View>
        {item.isActive && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => handleCloseSession(item.id)}
          >
            <Text style={styles.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    ),
    [router]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sessões de Jogo</Text>

      <View style={styles.createBox}>
        <TextInput
          placeholder="Nome da sessão"
          value={newName}
          onChangeText={setNewName}
          style={styles.input}
        />
        <TextInput
          placeholder="Local (opcional)"
          value={newLocation}
          onChangeText={setNewLocation}
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.createBtn, creating && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>+ Criar Sessão</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma sessão criada ainda</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.primary,
  },
  createBox: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "bold" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.onBackground },
  cardSubtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  cardStatus: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  closeBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  closeBtnText: { color: "#fff", fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#999" },
});
