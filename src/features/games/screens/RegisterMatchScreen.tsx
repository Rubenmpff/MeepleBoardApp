import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRegisterMatch } from "../hooks/useRegisterMatch";
import { Game } from "../types/Game";
import { MatchFormData } from "../types/MatchForm";
import { COLORS } from "@/src/constants/colors";
import PlayerSelector from "../../users/components/PlayerSelector";
import { usePlayers } from "../../users/hooks/usePlayers";
import { PlayerState } from "../../users/types/PlayerState";
import { toMatchPlayerDto } from "../../users/utils/playerMappers";
import { GameSelector } from "../components/GameSelector";
import { ExpansionSelector } from "../components/ExpansionSelector";
import { useUser } from "@/src/features/users/hooks/useUser";


export default function RegisterMatchForm() {
  const { submitMatch, loading, error } = useRegisterMatch();
  const { players, loading: playersLoading } = usePlayers();

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedExpansions, setSelectedExpansions] = useState<Game[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState[]>([]);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [comments, setComments] = useState("");
  const [success, setSuccess] = useState(false);
  const { user } = useUser();


  const handleSubmit = async () => {
    if (!selectedGame) {
      Alert.alert("Error", "Please select a game before continuing.");
      return;
    }

    if (playerState.length === 0) {
      Alert.alert("Error", "Please add at least one player.");
      return;
    }

    const winner = playerState.find((p) => p.isWinner);
    if (!winner) {
      Alert.alert("Error", "Please mark the winner of the match.");
      return;
    }

    const data: MatchFormData = {
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      matchDate: new Date().toISOString(),
      location: location.trim() || undefined,
      durationInMinutes: duration ? Number(duration) : undefined,
      isSoloGame: false,
      players: toMatchPlayerDto(playerState),
      scoreSummary: comments.trim() || undefined,
      winnerId: winner.id,
      expansions: selectedExpansions.map((e) => ({
        bggId: e.bggId!,
        name: e.name,
      })),
    };

    const result = await submitMatch(data);
    if (result) {
      setSuccess(true);
      Alert.alert("✅ Success", "Match registered successfully!");
      clearForm();
    }
  };

  const clearForm = () => {
    setSelectedGame(null);
    setSelectedExpansions([]);
    setPlayerState([]);
    setLocation("");
    setDuration("");
    setComments("");
    setSuccess(false);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      extraScrollHeight={Platform.OS === "ios" ? 100 : 80}
    >
      <Text style={styles.title}>Register Match</Text>

      <GameSelector
        onSelect={(game) => {
          setSelectedGame(game);
          setSelectedExpansions([]);
        }}
      />

      {selectedGame && (
        <>
          <View style={styles.selectedGameContainer}>
            <Text style={styles.selectedGameTitle}>🎲 {selectedGame.name}</Text>
            {selectedGame.imageUrl && (
              <Image
                source={{ uri: selectedGame.imageUrl }}
                style={styles.gameImage}
                resizeMode="contain"
              />
            )}
            {selectedGame.description && (
              <Text style={styles.gameDescription}>
                {selectedGame.description.length > 100
                  ? selectedGame.description.slice(0, 100) + "..."
                  : selectedGame.description}
              </Text>
            )}
          </View>

          <ExpansionSelector
            baseGameId={selectedGame.id}
            selectedExpansions={selectedExpansions}
            onChange={setSelectedExpansions}
          />

          {playersLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <PlayerSelector
              users={players}
              players={playerState}
              onChange={setPlayerState}
              currentUser={user ? { id: user.id, userName: user.userName } : undefined}
            />
          )}
        </>
      )}

      <Text style={styles.label}>📍 Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        style={styles.input}
        placeholder="e.g., LeiriaCon"
      />

      <Text style={styles.label}>⏱️ Duration (minutes)</Text>
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
        placeholder="e.g., Intense and close match!"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Match</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
      {success && (
        <Text style={styles.success}>✅ Match registered successfully!</Text>
      )}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
    color: COLORS.onBackground,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 30,
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    marginTop: 12,
    color: "red",
    fontWeight: "600",
    textAlign: "center",
  },
  success: {
    marginTop: 12,
    color: "green",
    fontWeight: "600",
    textAlign: "center",
  },
  selectedGameContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  selectedGameTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
    color: COLORS.primary,
  },
  gameImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  gameDescription: {
    fontSize: 14,
    color: COLORS.onBackground,
  },
});
