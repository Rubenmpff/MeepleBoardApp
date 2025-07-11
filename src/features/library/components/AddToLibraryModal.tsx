import React from "react";
import { Modal, View, Text, Button } from "react-native";
import { Game } from "@/src/features/games/types/Game";
import { GameSuggestion } from "@/src/features/games/types/GameSuggestion";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
};

export default function AddToLibraryModal({ visible, onClose, game }: Props) {
  const isValidGame = "id" in game;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            {isValidGame
              ? `Adicionar "${game.name}" à tua biblioteca?`
              : `Este jogo não pode ser adicionado.`}
          </Text>

          <Button title="Fechar" onPress={onClose} disabled={!isValidGame} />
        </View>
      </View>
    </Modal>
  );
}
