// src/features/users/components/PlayerSelector.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";

import { User } from "../types/User";
import { PlayerState } from "../types/PlayerState";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

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
  selectionOnly?: boolean;
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
  title,
  mode = "quick",
  lockCurrentUser,
  maxResults = 12,
  selectionOnly = false,
}: Props) {
  const { t } = useTranslation("matches");
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
        {title ?? t("steps.players")} {selectedCount > 0 ? `(${selectedCount})` : ""}
      </Text>

      {/* Selected chips */}
      {!selectionOnly && players.length > 0 && (
        <View style={styles.chipsWrap}>
          {players.map((p) => (
            <View key={p.id} style={[styles.chip, p.isWinner && styles.chipWinner]}>
              <Text style={styles.chipText}>
                {p.username} {isMe(p.id) ? `(${t("players.you")})` : ""}
              </Text>

              {!(shouldLockMe && isMe(p.id)) && (
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("selector.removePlayer", { name: p.username })} onPress={() => removePlayer(p.id)} style={styles.chipRemove}>
                  <Text style={styles.chipRemoveText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {selectionOnly && <View>
        {players.map(p => <View key={p.id} style={styles.selectedRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{p.username?.slice(0, 1).toUpperCase() || "?"}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.compactName}>{p.username}</Text>
            {shouldLockMe && isMe(p.id) && <Text style={styles.requiredHint}>{t("selector.participationRequired")}</Text>}
          </View>
          {shouldLockMe && isMe(p.id) ? <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} /> :
            <TouchableOpacity style={styles.clearBtn} accessibilityRole="button" accessibilityLabel={t("selector.removePlayer", { name: p.username })} onPress={() => removePlayer(p.id)}>
              <MaterialIcons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>}
        </View>)}
      </View>}

      {/* Search bar */}
      <Text style={styles.section}>{t("selector.addPlayers")}</Text>
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          placeholder={mode === "session" ? t("selector.searchMembers") : t("selector.searchFriends")}
          accessibilityLabel={mode === "session" ? t("selector.searchMembers") : t("selector.searchFriends")}
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {!!query && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("selector.clear")} onPress={clearSearch} style={styles.clearBtn} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions */}
      {filteredToAdd.length === 0 ? (
        <Text style={styles.emptyText}>
          {debouncedQuery.trim() ? t("selector.noMatches") : t("selector.noMore")}
        </Text>
      ) : (
        <View>
          {filteredToAdd.map((item) => {
            const parts = highlightParts(item.userName || "—", debouncedQuery);
            return (
              <View key={item.id} style={styles.friendRow}>
                <Text style={styles.friendName}>
                  {parts.map((p, idx) => (
                    <Text key={idx} style={p.match ? styles.friendNameMatch : undefined}>
                      {p.text}
                    </Text>
                  ))}
                </Text>
                <TouchableOpacity style={styles.addBtn} accessibilityRole="button" accessibilityLabel={t("selector.addPlayer", { name: item.userName })} onPress={() => addPlayer(item)}>
                  <Text style={styles.addBtnText}>{t("selector.add")}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Details for legacy callers; shared registration has its own Result step. */}
      {!selectionOnly && players.length > 0 && (
        <>
          <Text style={styles.section}>{t("selector.details")}</Text>

          {players.map((p) => (
            <View key={p.id} style={styles.playerCard}>
              <View style={styles.playerHeader}>
                <Text style={styles.playerName}>
                  {p.username} {isMe(p.id) ? `(${t("players.you")})` : ""}
                </Text>

                {!(shouldLockMe && isMe(p.id)) && (
                  <TouchableOpacity style={styles.removeBtn} accessibilityRole="button" accessibilityLabel={t("selector.removePlayer", { name: p.username })} onPress={() => removePlayer(p.id)}>
                    <Text style={styles.removeBtnText}>{t("selector.remove")}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                placeholder={t("players.finalScoreOptional")}
                accessibilityLabel={t("selector.scoreFor", { name: p.username })}
                placeholderTextColor={COLORS.textMuted}
                style={styles.score}
                value={p.score ?? ""}
                keyboardType="numeric"
                onChangeText={(t) => updateScore(p.id, t)}
              />

              {winnerEnabled ? (
                <TouchableOpacity
                  style={[styles.winnerBtn, p.isWinner && styles.winnerBtnActive]}
                  accessibilityRole="radio" accessibilityLabel={t("selector.winnerFor", { name: p.username })} accessibilityState={{ selected: p.isWinner }} onPress={() => setWinner(p.id)}
                >
                  <Text style={styles.winnerText}>{p.isWinner ? t("selector.winner") : t("selector.setWinner")}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.winnerHintBox}>
                  <Text style={styles.winnerHintText}>{t("selector.soloHint")}</Text>
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
  compactName: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700" },
  requiredHint: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 2 },
  selectedRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primarySoft },
  avatarText: { color: COLORS.primary, fontWeight: "800", fontSize: 16 },
  container: { marginTop: 0 },
  title: { ...UI_STYLES.section, marginBottom: 12 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: { maxWidth: "100%", flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primarySoft, borderRadius: 12, paddingLeft: 12, paddingRight: 4, minHeight: 44 },
  chipWinner: { backgroundColor: "rgba(92,184,92,0.20)" },
  chipText: { ...UI_STYLES.body, flexShrink: 1 },
  chipRemove: { ...UI_STYLES.iconButton, marginLeft: 4 },
  chipRemoveText: { fontWeight: "900", color: "#444", marginTop: -1 },

  section: { ...UI_STYLES.body, fontWeight: "700", marginTop: 16, marginBottom: 8 },

  searchWrap: { ...UI_STYLES.field, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 0 },
  searchInput: { ...UI_STYLES.body, flex: 1, minHeight: 52, color: COLORS.onBackground },
  clearBtn: { ...UI_STYLES.iconButton },

  emptyText: { ...UI_STYLES.caption, color: COLORS.textMuted, marginVertical: 12 },

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

  addBtn: { ...UI_STYLES.control, paddingHorizontal: 16, backgroundColor: COLORS.primary },
  addBtnText: { color: "#fff", fontWeight: "900" },

  playerCard: { ...UI_STYLES.card, padding: 16, marginTop: 12 },
  playerHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 },
  playerName: { ...UI_STYLES.body, fontWeight: "700", flex: 1, minWidth: 90 },

  removeBtn: { ...UI_STYLES.control, paddingHorizontal: 12, backgroundColor: COLORS.error },
  removeBtnText: { color: "#fff", fontWeight: "900" },

  score: { ...UI_STYLES.field, marginBottom: 12 },

  winnerBtn: { ...UI_STYLES.button, backgroundColor: COLORS.textMuted },
  winnerBtnActive: { backgroundColor: COLORS.success },
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
  winnerHintText: { ...UI_STYLES.caption, color: COLORS.textMuted },
});
