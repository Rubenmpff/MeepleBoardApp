// src/features/users/components/PlayerSelector.tsx
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import { User } from "../types/User";
import { PlayerState } from "../types/PlayerState";

interface Props {
  users: User[];
  players: PlayerState[];
  onChange: (updated: PlayerState[]) => void;
}

export default function PlayerSelector({ users, players, onChange }: Props) {
  // 🧩 Ensure all users have an entry in players state
  useEffect(() => {
    const missingPlayers = users.filter(
      (u) => !players.find((p) => p.id === u.id)
    );

    if (missingPlayers.length > 0) {
      const newEntries = missingPlayers.map((u) => ({
        id: u.id,
        username: u.userName,
        score: "",
        isWinner: false,
      }));
      onChange([...players, ...newEntries]);
    }
  }, [users, players]);

  const toggleWinner = (id: string) => {
    onChange(
      players.map((p) =>
        p.id === id ? { ...p, isWinner: !p.isWinner } : p
      )
    );
  };

  const updateScore = (id: string, score: string) => {
    onChange(
      players.map((p) => (p.id === id ? { ...p, score } : p))
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Players</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playerItem}>
            <Text style={styles.name}>{item.username}</Text>

            <TextInput
              placeholder="Score"
              style={styles.input}
              value={item.score}
              keyboardType="numeric"
              onChangeText={(text) => updateScore(item.id, text)}
            />

            <TouchableOpacity
              style={[
                styles.winnerButton,
                item.isWinner && styles.winnerSelected,
              ]}
              onPress={() => toggleWinner(item.id)}
            >
              <Text style={styles.winnerText}>
                {item.isWinner ? "🏆 Winner" : "Mark as winner"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  playerItem: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  winnerButton: {
    backgroundColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  winnerSelected: {
    backgroundColor: "#5cb85c",
  },
  winnerText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
