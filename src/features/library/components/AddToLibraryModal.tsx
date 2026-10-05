import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";
import { Game } from "@/src/features/games/catalog/types/Game";
import { GameSuggestion } from "@/src/features/games/catalog/types/GameSuggestion";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
  onAddToLibrary: (pricePaid?: number) => void;
};

export default function AddToLibraryModal({
  visible,
  onClose,
  game,
  onAddToLibrary,
}: Props) {
  const { t } = useTranslation("library");
  const [step, setStep] = useState<"options" | "price">("options");
  const [price, setPrice] = useState("");

  function handleConfirm() {
    const normalized = price.replace(",", ".");
    const numericPrice = Number.parseFloat(normalized) || 0;
    onAddToLibrary(numericPrice);
    handleClose();
  }

  function handleSkip() {
    onAddToLibrary(undefined);
    handleClose();
  }

  function handleClose() {
    setPrice("");
    setStep("options");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {step === "price" && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep("options")}
              accessibilityRole="button"
              accessibilityLabel={t("addModal.backAccessibility")}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}

          <Text style={styles.title}>
            {t("addModal.title", { name: game.name })}
          </Text>

          {step === "options" ? (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setStep("price")}
              >
                <Text style={styles.primaryBtnText}>
                  {t("addModal.addLibrary")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.disabledBtn} disabled>
                <Text style={styles.disabledText}>
                  {t("addModal.addWishlistSoon")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>
                  {t("addModal.cancel")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>
                {t("addModal.priceLabel")}
              </Text>

              <TextInput
                style={styles.input}
                placeholder={t("addModal.pricePlaceholder")}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.note}>
                {t("addModal.giftNote")}
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleConfirm}
              >
                <Text style={styles.primaryBtnText}>
                  {t("addModal.confirm")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>
                  {t("addModal.skip", { defaultValue: "Skip" })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>
                  {t("addModal.cancel")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modal: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 12, width: "85%", elevation: 4 },
  backBtn: { position: "absolute", top: 10, left: 10, padding: 4, zIndex: 10 },
  title: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 20, color: COLORS.onBackground },
  label: { fontSize: 14, fontWeight: "500", color: COLORS.onBackground, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: COLORS.surface, color: COLORS.onBackground },
  note: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16, textAlign: "center" },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "600" },
  disabledBtn: { backgroundColor: "#E0E0E0", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  disabledText: { color: "#999999" },
  cancelBtn: { backgroundColor: COLORS.background, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  cancelText: { color: COLORS.onBackground },
  skipBtn: { paddingVertical: 10, alignItems: "center", marginTop: 4 },
  skipText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },
});