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
import { MaterialIcons } from "@expo/vector-icons";

import { User } from "../types/User";
import { PlayerState } from "../types/PlayerState";
import { COLORS } from "@/src/constants/colors";

type Props = {
  /** Lista de utilizadores disponíveis para adicionar (friends ou membros accepted da sessão) */
  users: User[];

  /** Jogadores selecionados no match */
  players: PlayerState[];

  /** Callback para atualizar */
  onChange: (updated: PlayerState[]) => void;

  /** Utilizador autenticado (opcional) */
  currentUser?: { id: string; userName: string };

  /** Título opcional */
  title?: string;

  /**
   * Modo:
   * - quick: normalmente queres incluir e "lockar" o currentUser (não removível)
   * - session: não forces nada
   */
  mode?: "quick" | "session";

  /**
   * Se true, adiciona o currentUser automaticamente (1x) e não deixa remover.
   * Default: true em quick, false em session.
   */
  lockCurrentUser?: boolean;

  /** Limita quantos resultados mostramos (UX + performance) */
  maxResults?: number;
};

function normalizeText(v: string) {
  return (v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim();
}

/** Highlight simples: separa em partes e pinta o match */
function highlightParts(name: string, query: string) {
  const n = name ?? "";
  const q = query.trim();
  if (!q) return [{ text: n, match: false }];

  const nNorm = normalizeText(n);
  const qNorm = normalizeText(q);

  const idx = nNorm.indexOf(qNorm);
  if (idx < 0) return [{ text: n, match: false }];

  // ⚠️ idx baseado no normalizado, mas aqui funciona ok na maioria dos casos.
  // Se quiseres 100% perfeito com acentos, dá mais trabalho.
  const start = idx;
  const end = idx + qNorm.length;

  return [
    { text: n.slice(0, start), match: false },
    { text: n.slice(start, end), match: true },
    { text: n.slice(end), match: false },
  ];
}

export default function PlayerSelector({
  users,
  players,
  onChange,
  currentUser,
  title = "Players",
  mode = "quick",
  lockCurrentUser,
  maxResults = 12,
}: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const shouldLockMe = lockCurrentUser ?? mode === "quick";

  const isSelected = (id: string) => players.some((p) => p.id === id);
  const isMe = (id: string) => !!currentUser?.id && id === currentUser.id;

  /** ✅ Debounce para filtrar sem lag */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  /** ✅ Em quick match: garante que "eu" entra 1x e fica lá */
  useEffect(() => {
    if (!shouldLockMe) return;
    if (!currentUser?.id) return;

    const already = players.some((p) => p.id === currentUser.id);
    if (already) return;

    onChange([
      { id: currentUser.id, username: currentUser.userName, score: "", isWinner: false },
      ...players,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, shouldLockMe]);

  const addPlayer = (u: User) => {
    if (!u?.id) return;
    if (isSelected(u.id)) return;
    onChange([...players, { id: u.id, username: u.userName, score: "", isWinner: false }]);
  };

  const removePlayer = (id: string) => {
    if (shouldLockMe && isMe(id)) return;

    const removedWasWinner = players.some((p) => p.id === id && p.isWinner);
    let next = players.filter((p) => p.id !== id);

    if (removedWasWinner) {
      next = next.map((p) => ({ ...p, isWinner: false }));
    }

    onChange(next);
  };

  const setWinner = (id: string) => {
    onChange(players.map((p) => ({ ...p, isWinner: p.id === id })));
  };

  const updateScore = (id: string, score: string) => {
    onChange(players.map((p) => (p.id === id ? { ...p, score } : p)));
  };

  const selectedCount = players.length;
  const winnerEnabled = players.length > 1;

  const filteredToAdd = useMemo(() => {
    const q = normalizeText(debouncedQuery);

    const base = (users ?? [])
      .filter((u) => u?.id && !isSelected(u.id))
      .map((u) => ({
        ...u,
        _norm: normalizeText(u.userName || ""),
      }));

    const ranked = q
      ? base
          .filter((u) => u._norm.includes(q))
          // ranking simples: começa com query primeiro, depois contém
          .sort((a, b) => {
            const aStarts = a._norm.startsWith(q) ? 0 : 1;
            const bStarts = b._norm.startsWith(q) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            return (a.userName || "").localeCompare(b.userName || "");
          })
      : base.sort((a, b) => (a.userName || "").localeCompare(b.userName || ""));

    return ranked.slice(0, maxResults);
  }, [users, players, debouncedQuery, maxResults]);

  const clearSearch = () => setQuery("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title} {selectedCount > 0 ? `(${selectedCount})` : ""}
      </Text>

      {/* Selected chips */}
      {players.length > 0 && (
        <View style={styles.chipsWrap}>
          {players.map((p) => (
            <View key={p.id} style={[styles.chip, p.isWinner && styles.chipWinner]}>
              <Text style={styles.chipText}>
                {p.username} {isMe(p.id) ? "(you)" : ""}
              </Text>

              {!(shouldLockMe && isMe(p.id)) && (
                <TouchableOpacity onPress={() => removePlayer(p.id)} style={styles.chipRemove}>
                  <Text style={styles.chipRemoveText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Search bar */}
      <Text style={styles.section}>Add players</Text>
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color="#777" />
        <TextInput
          placeholder={mode === "session" ? "Search members..." : "Search friends..."}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {!!query && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearBtn} hitSlop={8}>
            <MaterialIcons name="close" size={18} color="#777" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions */}
      {filteredToAdd.length === 0 ? (
        <Text style={styles.emptyText}>
          {debouncedQuery.trim() ? "No matches found." : "No more players to add."}
        </Text>
      ) : (
        <FlatList
          data={filteredToAdd}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const parts = highlightParts(item.userName || "—", debouncedQuery);
            return (
              <View style={styles.friendRow}>
                <Text style={styles.friendName} numberOfLines={1}>
                  {parts.map((p, idx) => (
                    <Text key={idx} style={p.match ? styles.friendNameMatch : undefined}>
                      {p.text}
                    </Text>
                  ))}
                </Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addPlayer(item)}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Details */}
      {players.length > 0 && (
        <>
          <Text style={styles.section}>Details</Text>

          {players.map((p) => (
            <View key={p.id} style={styles.playerCard}>
              <View style={styles.playerHeader}>
                <Text style={styles.playerName}>
                  {p.username} {isMe(p.id) ? "(you)" : ""}
                </Text>

                {!(shouldLockMe && isMe(p.id)) && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removePlayer(p.id)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                placeholder="Score (optional)"
                style={styles.score}
                value={p.score ?? ""}
                keyboardType="numeric"
                onChangeText={(t) => updateScore(p.id, t)}
              />

              {winnerEnabled ? (
                <TouchableOpacity
                  style={[styles.winnerBtn, p.isWinner && styles.winnerBtnActive]}
                  onPress={() => setWinner(p.id)}
                >
                  <Text style={styles.winnerText}>{p.isWinner ? "🏆 Winner" : "Set as winner"}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.winnerHintBox}>
                  <Text style={styles.winnerHintText}>Solo match: winner is optional.</Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  title: { fontWeight: "900", fontSize: 16, marginBottom: 10, color: COLORS.onBackground },

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
  chipText: { fontWeight: "800", color: COLORS.onBackground },
  chipRemove: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
  },
  chipRemoveText: { fontWeight: "900", color: "#444", marginTop: -1 },

  section: { marginTop: 10, marginBottom: 8, fontWeight: "900", color: COLORS.onBackground },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontWeight: "700", color: COLORS.onBackground },
  clearBtn: { padding: 2 },

  emptyText: { color: "#666", marginTop: 8, marginBottom: 8, fontWeight: "700" },

  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  friendName: { fontSize: 15, fontWeight: "900", color: COLORS.onBackground, flex: 1, paddingRight: 10 },
  friendNameMatch: { textDecorationLine: "underline" },

  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "900" },

  playerCard: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#eee", padding: 12, marginTop: 10 },
  playerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  playerName: { fontSize: 16, fontWeight: "900", color: COLORS.onBackground },

  removeBtn: { backgroundColor: "#d9534f", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  removeBtnText: { color: "#fff", fontWeight: "900" },

  score: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, padding: 10, backgroundColor: "#fff", marginBottom: 10, fontWeight: "700" },

  winnerBtn: { backgroundColor: "#ccc", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  winnerBtnActive: { backgroundColor: "#5cb85c" },
  winnerText: { color: "#fff", fontWeight: "900" },

  winnerHintBox: {
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  winnerHintText: { color: "#777", fontWeight: "900" },
});