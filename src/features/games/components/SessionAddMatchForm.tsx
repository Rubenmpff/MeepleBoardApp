// src/features/games/components/SessionAddMatchForm.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import sessionService from "../services/sessionService";
import { MatchFormData } from "../types/MatchForm";
import { Game } from "../types/Game";
import { COLORS } from "@/src/constants/colors";
import PlayerSelector from "../../users/components/PlayerSelector";
import { usePlayers } from "../../users/hooks/usePlayers";
import { PlayerState } from "../../users/types/PlayerState";
import { toMatchPlayerDto } from "../../users/utils/playerMappers";
import { GameSelector } from "./GameSelector";
import { ExpansionSelector } from "./ExpansionSelector";
import { useFriends } from "../../friends/hooks/useFriends";

type Props = {
  sessionId: string;
  onSuccess?: () => void;
};

export default function SessionAddMatchForm({ sessionId, onSuccess }: Props) {
  const { friends, loading: friendsLoading } = useFriends();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedExpansions, setSelectedExpansions] = useState<Game[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState[]>([]);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedGame) return Alert.alert("Error", "Select a game first.");
    if (playerState.length === 0) return Alert.alert("Error", "Add at least one player.");
    const winner = playerState.find((p) => p.isWinner);
    if (!winner) return Alert.alert("Error", "Select the winner.");

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

    try {
      setLoading(true);
      await sessionService.addMatch(sessionId, payload);
      Alert.alert("✅ Success", "Match added to session!");
      clearForm();
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", "Failed to add match. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSelectedGame(null);
    setSelectedExpansions([]);
    setPlayerState([]);
    setLocation("");
    setDuration("");
    setComments("");
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      extraScrollHeight={Platform.OS === "ios" ? 100 : 80}
    >
      <Text style={styles.title}>Add Match to Session</Text>

      <GameSelector onSelect={(g) => { setSelectedGame(g); setSelectedExpansions([]); }} />

      {selectedGame && (
        <>
          <View style={styles.selectedGameContainer}>
            <Text style={styles.selectedGameTitle}>🎲 {selectedGame.name}</Text>
            {selectedGame.imageUrl && (
              <Image source={{ uri: selectedGame.imageUrl }} style={styles.gameImage} />
            )}
          </View>

          <ExpansionSelector
            baseGameId={selectedGame.id}
            selectedExpansions={selectedExpansions}
            onChange={setSelectedExpansions}
          />

          {friendsLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
          <PlayerSelector
          users={friends}
          players={playerState}
          onChange={setPlayerState}
          />
          )}
        </>
      )}

      <Text style={styles.label}>📍 Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />

      <Text style={styles.label}>⏱️ Duration (minutes)</Text>
      <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" />

      <Text style={styles.label}>📝 Comments</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={comments}
        onChangeText={setComments}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Match</Text>}
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: COLORS.background, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.primary, marginBottom: 20, textAlign: "center" },
  label: { fontWeight: "600", marginTop: 16, marginBottom: 4, color: COLORS.onBackground },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, backgroundColor: "#fff" },
  button: { marginTop: 30, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  selectedGameContainer: { backgroundColor: "#f9f9f9", borderRadius: 10, padding: 12, marginBottom: 12 },
  selectedGameTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 6, color: COLORS.primary },
  gameImage: { width: "100%", height: 150, borderRadius: 8, marginBottom: 10 },
});
