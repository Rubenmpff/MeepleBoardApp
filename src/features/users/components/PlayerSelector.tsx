// src/features/users/components/PlayerSelector.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { User } from "../types/User";
import { PlayerState } from "../types/PlayerState";
import { COLORS } from "@/src/constants/colors";

type Props = {
  users: User[]; // friends OR all users (no futuro)
  players: PlayerState[];
  onChange: (updated: PlayerState[]) => void;
  currentUser?: { id: string; userName: string };
  title?: string;
};

export default function PlayerSelector({
  users,
  players,
  onChange,
  currentUser,
  title = "Players",
}: Props) {
  const [query, setQuery] = useState("");

  // ✅ garante que "eu" entra 1x e fica lá
  useEffect(() => {
    if (!currentUser?.id) return;

    const already = players.some((p) => p.id === currentUser.id);
    if (already) return;

    onChange([
      { id: currentUser.id, username: currentUser.userName, score: "", isWinner: false },
      ...players,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const isSelected = (id: string) => players.some((p) => p.id === id);
  const isMe = (id: string) => !!currentUser?.id && id === currentUser.id;

  const filteredToAdd = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users
      .filter((u) => !isSelected(u.id)) // não mostrar já selecionados
      .filter((u) => (q ? u.userName?.toLowerCase().includes(q) : true))
      .sort((a, b) => a.userName.localeCompare(b.userName));
  }, [users, query, players]);

  const addPlayer = (u: User) => {
    if (isSelected(u.id)) return;
    onChange([...players, { id: u.id, username: u.userName, score: "", isWinner: false }]);
  };

  const removePlayer = (id: string) => {
    if (isMe(id)) return; // não remover o próprio

    const next = players.filter((p) => p.id !== id);

    // ✅ se removeste o winner, fica sem winner
    onChange(next);
  };

  const setWinner = (id: string) => {
    onChange(players.map((p) => ({ ...p, isWinner: p.id === id })));
  };

  const updateScore = (id: string, score: string) => {
    onChange(players.map((p) => (p.id === id ? { ...p, score } : p)));
  };

  const selectedCount = players.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title} {selectedCount > 0 ? `(${selectedCount})` : ""}
      </Text>

      {/* Selected players (chips) */}
      {players.length > 0 && (
        <View style={styles.chipsWrap}>
          {players.map((p) => (
            <View key={p.id} style={[styles.chip, p.isWinner && styles.chipWinner]}>
              <Text style={styles.chipText}>
                {p.username} {isMe(p.id) ? "(you)" : ""}
              </Text>
              {!isMe(p.id) && (
                <TouchableOpacity onPress={() => removePlayer(p.id)} style={styles.chipRemove}>
                  <Text style={styles.chipRemoveText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Search + Add */}
      <Text style={styles.section}>Add friends</Text>
      <TextInput
        placeholder="Search friends..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        autoCapitalize="none"
      />

      {filteredToAdd.length === 0 ? (
        <Text style={styles.emptyText}>
          {query ? "No friends match your search." : "No more friends to add."}
        </Text>
      ) : (
        <FlatList
          data={filteredToAdd}
          keyExtractor={(i) => i.id}
          scrollEnabled={false} // importante para não brigar com scroll do ecrã
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <Text style={styles.friendName}>{item.userName}</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => addPlayer(item)}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Selected players details */}
      {players.length > 0 && (
        <>
          <Text style={styles.section}>Details</Text>

          {players.map((p) => (
            <View key={p.id} style={styles.playerCard}>
              <View style={styles.playerHeader}>
                <Text style={styles.playerName}>
                  {p.username} {isMe(p.id) ? "(you)" : ""}
                </Text>

                {!isMe(p.id) && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removePlayer(p.id)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                placeholder="Score"
                style={styles.score}
                value={p.score ?? ""}
                keyboardType="numeric"
                onChangeText={(t) => updateScore(p.id, t)}
              />

              <TouchableOpacity
                style={[styles.winnerBtn, p.isWinner && styles.winnerBtnActive]}
                onPress={() => setWinner(p.id)}
              >
                <Text style={styles.winnerText}>{p.isWinner ? "🏆 Winner" : "Set as winner"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  title: { fontWeight: "800", fontSize: 16, marginBottom: 10, color: COLORS.onBackground },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipWinner: { backgroundColor: "rgba(92,184,92,0.20)" },
  chipText: { fontWeight: "700", color: COLORS.onBackground },
  chipRemove: { marginLeft: 8, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#ddd" },
  chipRemoveText: { fontWeight: "900", color: "#444", marginTop: -1 },

  section: { marginTop: 10, marginBottom: 8, fontWeight: "800", color: COLORS.onBackground },

  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },

  emptyText: { color: "#666", marginBottom: 8 },

  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  friendName: { fontSize: 15, fontWeight: "700", color: COLORS.onBackground },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "800" },

  playerCard: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#eee", padding: 12, marginBottom: 10 },
  playerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  playerName: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground },

  removeBtn: { backgroundColor: "#d9534f", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  removeBtnText: { color: "#fff", fontWeight: "900" },

  score: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, backgroundColor: "#fff", marginBottom: 10 },

  winnerBtn: { backgroundColor: "#ccc", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  winnerBtnActive: { backgroundColor: "#5cb85c" },
  winnerText: { color: "#fff", fontWeight: "900" },
});
