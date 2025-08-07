import React, { useCallback } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Alert } from "react-native";
import Toast from "react-native-toast-message";

import { Game } from "@/src/features/games/types/Game";
import { GameSuggestion } from "@/src/features/games/types/GameSuggestion";
import { useLibraryActions } from "@/src/features/library/hooks/useLibraryActions";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
};

export default function ManageLibraryEntryModal({ visible, onClose, game }: Props) {
  const { removeGame, loading } = useLibraryActions();
  const isValidGame = !!game?.id || !!game?.bggId;

  const handleRemove = useCallback(() => {
    if (!isValidGame) return;

    Alert.alert(
      "Remover jogo",
      `Tens a certeza que queres remover "${game.name}" da tua biblioteca?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removeGame(game.id!); // <-- Redux já faz a API + update store
              Toast.show({
                type: "success",
                text1: `"${game.name}" removido da biblioteca`,
              });
              onClose();
            } catch (err) {
              console.error("❌ Erro ao remover jogo:", err);
              Toast.show({
                type: "error",
                text1: "Erro ao remover jogo",
                text2: "Tenta novamente mais tarde.",
              });
            }
          },
        },
      ]
    );
  }, [game, isValidGame, removeGame, onClose]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {isValidGame
              ? `Gerir entrada: "${game.name}"`
              : "Este jogo não pode ser gerido (falta ID válido)."}
          </Text>

          <View style={styles.actions}>
            {isValidGame && (
              <Pressable
                style={[styles.button, styles.remove]}
                onPress={handleRemove}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Remover</Text>
              </Pressable>
            )}

            <Pressable style={[styles.button, styles.close]} onPress={onClose}>
              <Text style={styles.buttonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#222",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  close: {
    backgroundColor: "#1e90ff",
  },
  remove: {
    backgroundColor: "#c00",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
