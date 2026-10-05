import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import libraryService from "@/src/features/library/services/libraryService";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { UserGameLibrary } from "@/src/features/library/types/UserGameLibrary";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";

type Props = {
  visible: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
  playedTogetherGameIds: Set<string>;
};

export function WhatCanWePlayModal({ visible, onClose, friendId, friendName, playedTogetherGameIds }: Props) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commonGames, setCommonGames] = useState<UserGameLibrary[] | null>(null);

  useEffect(() => {
    if (!visible || !currentUser?.id || commonGames !== null) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [mine, theirs]: [UserGameLibrary[], UserGameLibrary[]] = await Promise.all([
          libraryService.getUserLibrary(currentUser.id),
          libraryService.getUserLibrary(friendId),
        ]);
        if (cancelled) return;

        const myOwnedIds = new Set(
          (mine ?? []).filter((g) => g.status === GameLibraryStatus.Owned).map((g) => g.gameId)
        );
        const common = (theirs ?? []).filter(
          (g) => g.status === GameLibraryStatus.Owned && myOwnedIds.has(g.gameId)
        );
        setCommonGames(common);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 403) setError(`A coleção de ${friendName} é privada.`);
        else setError("Não foi possível cruzar as coleções.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible, currentUser?.id, friendId, friendName, commonGames]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>O que podemos jogar?</Text>
            <Text style={styles.subtitle}>Jogos que ambos têm na coleção</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={26} color={COLORS.onBackground} />
          </TouchableOpacity>
        </View>

        {loading && <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>}

        {!loading && !!error && (
          <View style={styles.center}>
            <Ionicons name="lock-closed-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={commonGames ?? []}
            keyExtractor={(item) => item.gameId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.gameImageUrl ? (
                  <Image source={{ uri: item.gameImageUrl }} style={styles.cover} />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder]}><Ionicons name="dice-outline" size={22} color={COLORS.textMuted} /></View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.gameName}</Text>
                  <View style={styles.checks}>
                    <Text style={styles.checkLine}>✓ {friendName} tem</Text>
                    {(item.minPlayers || item.maxPlayers) && (
                      <Text style={styles.checkLine}>
                        ✓ {item.minPlayers ?? "?"}–{item.maxPlayers ?? "?"} jogadores
                      </Text>
                    )}
                    {playedTogetherGameIds.has(item.gameId) && (
                      <Text style={styles.checkLine}>✓ Já jogaram juntos</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="game-controller-outline" size={40} color={COLORS.primary} />
                <Text style={styles.emptyTitle}>Ainda não têm jogos em comum na coleção.</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background, paddingTop: 56 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.onBackground },
  subtitle: { marginTop: 3, color: COLORS.textMuted },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, paddingTop: 60, gap: 10 },
  errorText: { color: COLORS.textMuted, textAlign: "center" },
  emptyTitle: { color: COLORS.textMuted, textAlign: "center" },

  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  cover: { width: 56, height: 56, borderRadius: 10, backgroundColor: COLORS.surface },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  cardTitle: { fontWeight: "800", color: COLORS.onBackground },
  checks: { marginTop: 4, gap: 2 },
  checkLine: { fontSize: 12, color: COLORS.textMuted },
});