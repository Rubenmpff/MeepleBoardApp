import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
} from "react-native";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";

import { useRegisterMatch } from "../hooks/useRegisterMatch";
import { usePlayers } from "../../users/hooks/usePlayers";
import { toMatchPlayerDto } from "../../users/utils/playerMappers";

import { GameSelector } from "../components/GameSelector";
import { ExpansionSelector } from "../components/ExpansionSelector";
import PlayerSelector from "../../users/components/PlayerSelector";

import { Game } from "../types/Game";
import { MatchFormData } from "../types/MatchForm";
import { PlayerState } from "../../users/types/PlayerState";
import { COLORS } from "@/src/constants/colors";
import { useFriends } from "../../friends/hooks/useFriends";

export default function RegisterMatchForm() {
  /* ────────────── hooks ────────────── */
  const { submitMatch, loading, error } = useRegisterMatch();
  const { friends, loading: friendsLoading } = useFriends();


  /* ────────────── local state ────────────── */
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedExpansions, setSelectedExpansions] = useState<Game[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState[]>([]);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [comments, setComments] = useState("");
  const [success, setSuccess] = useState(false);
  const [editingGame, setEditingGame] = useState(true);

  /* ────────────── form actions ────────────── */
  const clearForm = () => {
    setSelectedGame(null);
    setSelectedExpansions([]);
    setPlayerState([]);
    setLocation("");
    setDuration("");
    setComments("");
    setSuccess(false);
    setEditingGame(true);
  };

  const handleSubmit = async () => {
    if (!selectedGame)
      return Alert.alert("Error", "Please select a game before continuing.");
    if (playerState.length === 0)
      return Alert.alert("Error", "Add at least one player.");
    const winner = playerState.find((p) => p.isWinner);
    if (!winner) return Alert.alert("Error", "Select the winner of the match.");

    const payload: MatchFormData = {
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      matchDate: new Date().toISOString(),
      location: location.trim() || undefined,
      durationInMinutes: duration ? Number(duration) : undefined,
      isSoloGame: playerState.length === 1,
      players: toMatchPlayerDto(playerState),
      scoreSummary: comments.trim() || undefined,
      winnerId: winner.id,
      expansions: selectedExpansions.map((e) => ({
        bggId: e.bggId!,
        name: e.name,
      })),
    };

    const ok = await submitMatch(payload);
    if (ok) {
      Alert.alert("✅ Success", "Match registered successfully!");
      setSuccess(true);
      clearForm();
    }
  };

  /* ────────────── UI ────────────── */
  return (
    <KeyboardAwareFlatList
      data={[{ key: "form" }]}          /* single-item list -> 1 VirtualizedList */
      renderItem={() => (
        <View style={styles.container}>
          <Text style={styles.title}>Register Match</Text>

          {/* ─── Game selection ─── */}
          {editingGame ? (
            <View style={styles.card}>
              <GameSelector
                onSelect={(game) => {
                  setSelectedGame(game);
                  setSelectedExpansions([]);
                  setEditingGame(false);
                }}
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🎲 {selectedGame?.name}</Text>

              {!!selectedGame?.imageUrl && (
                <Image
                  source={{ uri: selectedGame.imageUrl }}
                  style={styles.image}
                />
              )}

              {!!selectedGame?.description && (
                <Text style={styles.description}>
                  {selectedGame.description.length > 100
                    ? `${selectedGame.description.slice(0, 100)} …`
                    : selectedGame.description}
                </Text>
              )}

              <TouchableOpacity
                onPress={() => {
                  setEditingGame(true);
                  setSelectedGame(null);
                  setSelectedExpansions([]);
                }}
                style={[styles.button, styles.changeBtn]}
              >
                <Text style={styles.changeBtnText}>🔄 Change Game</Text>
              </TouchableOpacity>
            </View>
          )}
          

          {/* ─── Expansions + players ─── */}
          {selectedGame && (
            <>
              <View style={styles.card}>
                <ExpansionSelector
                  baseGameId={selectedGame.id}
                  selectedExpansions={selectedExpansions}
                  onChange={setSelectedExpansions}
                />
              </View>

              

              <View style={styles.card}>
                {friendsLoading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                <PlayerSelector
                users={friends}
                players={playerState}
                onChange={setPlayerState}
                />
                )}
              </View>
            </>
          )}

          {/* ─── Extra info ─── */}
          <View style={styles.card}>
            <Text style={styles.label}>📍 Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              placeholder="e.g., LeiriaCon"
            />

            <Text style={styles.label}>⏱️ Duration (min)</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g., 90"
            />

            <Text style={styles.label}>📝 Comments</Text>
            <TextInput
              value={comments}
              onChangeText={setComments}
              style={[styles.input, { height: 80 }]}
              multiline
              placeholder="e.g., Very close match!"
            />
          </View>

          {/* ─── Submit ─── */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Match</Text>
            )}
          </TouchableOpacity>

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!success && (
            <Text style={styles.success}>
              ✅ Match registered successfully!
            </Text>
          )}
        </View>
      )}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
      extraScrollHeight={Platform.OS === "ios" ? 100 : 80}
    />
  );
}

/* ────────────── styles ────────────── */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  description: {
    fontSize: 14,
    color: COLORS.onBackground,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: COLORS.onBackground,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fdfdfd",
    padding: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  changeBtn: { backgroundColor: "#ddd", marginTop: 10 },
  changeBtnText: { color: "#333", fontWeight: "600" },
  error: {
    color: "#d00",
    fontWeight: "600",
    textAlign: "center",
  },
  success: {
    color: "#0a0",
    fontWeight: "600",
    textAlign: "center",
  },
});
