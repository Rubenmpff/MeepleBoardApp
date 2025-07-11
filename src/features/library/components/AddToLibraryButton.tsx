import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useAddGameToLibrary } from "../../library/hooks/useAddGameToLibrary";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { Game } from "../../games/types/Game";

interface Props {
  game: Game; // ✅ Recebe o objeto Game inteiro
  status?: GameLibraryStatus;
  label?: string;
  onSuccess?: () => void;
}

export function AddToLibraryButton({
  game,
  status = GameLibraryStatus.Owned,
  label = "+ Adicionar à Coleção",
  onSuccess,
}: Props) {
  const { addGame } = useAddGameToLibrary(); // ✅ função renomeada para addGame
  const { loading } = useAddGameToLibrary();

  const handleAdd = async () => {
    try {
      await addGame(game, status);
      onSuccess?.();
    } catch (err) {
      console.error("❌ Erro ao adicionar jogo à coleção:", err);
      Alert.alert("Erro", "Não foi possível adicionar o jogo à coleção.");
    }
  };

  return (
    <TouchableOpacity
      onPress={handleAdd}
      disabled={loading}
      style={styles.button}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1e90ff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
});
