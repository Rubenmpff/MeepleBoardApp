import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";
import { Game } from "@/src/features/games/types/Game";
import { GameSuggestion } from "@/src/features/games/types/GameSuggestion";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
  onAddToLibrary: (pricePaid: number) => void;
};

export default function AddToLibraryModal({
  visible,
  onClose,
  game,
  onAddToLibrary,
}: Props) {
  const [step, setStep] = useState<"options" | "price">("options");
  const [price, setPrice] = useState("");

  const handleConfirm = () => {
    const numericPrice = parseFloat(price) || 0;
    onAddToLibrary(numericPrice);
    handleClose();
  };

  const handleClose = () => {
    setPrice("");
    setStep("options");
    onClose();
  };

  if (!game) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {step === "price" && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep("options")}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          <Text style={styles.title}>Adicionar "{game.name}"</Text>

          {step === "options" ? (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setStep("price")}
              >
                <Text style={styles.primaryBtnText}>Adicionar à Biblioteca</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.disabledBtn} disabled>
                <Text style={styles.disabledText}>Adicionar à Wishlist (em breve)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.disabledBtn} disabled>
                <Text style={styles.disabledText}>
                  Adicionar aos Jogos Já Jogados (em breve)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Preço pago (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 35.50"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
              <Text style={styles.note}>Se foi oferecido, introduza 0</Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
                <Text style={styles.primaryBtnText}>Confirmar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
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
    padding: 20,
    borderRadius: 12,
    width: "85%",
    elevation: 4,
  },
  backBtn: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: 4,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.onBackground,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.onBackground,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  note: {
    fontSize: 12,
    color: "#888",
    marginBottom: 16,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabledBtn: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabledText: {
    color: "#999",
  },
  cancelBtn: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: {
    color: "#333",
  },
});
