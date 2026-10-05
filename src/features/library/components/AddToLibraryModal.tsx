import DialogSurface from "@/src/components/ui/DialogSurface";
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

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
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
      <DialogSurface>
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
              onPress={() => setStep("price")} accessibilityRole="button" accessibilityLabel={t("addModal.addLibrary")}
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

            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} accessibilityRole="button" accessibilityLabel={t("addModal.cancel")}>
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
              style={styles.input} accessibilityLabel={t("addModal.priceLabel")}
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
              onPress={handleConfirm} accessibilityRole="button" accessibilityLabel={t("addModal.confirm")}
            >
              <Text style={styles.primaryBtnText}>
                {t("addModal.confirm")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} accessibilityRole="button" accessibilityLabel={t("addModal.skip")}>
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
      </DialogSurface>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backBtn: { ...UI_STYLES.iconButton, marginBottom: 8 },
  title: { ...UI_STYLES.section, textAlign: "center", marginBottom: 20 },
  label: { ...UI_STYLES.body, fontWeight: "500", color: COLORS.onBackground, marginBottom: 8 },
  input: { ...UI_STYLES.field, marginBottom: 8 },
  note: { ...UI_STYLES.muted, marginBottom: 16, textAlign: "center" },
  primaryBtn: { ...UI_STYLES.button, backgroundColor: COLORS.primary, marginTop: 8 },
  primaryBtnText: { ...UI_STYLES.body, color: "#FFFFFF", fontWeight: "600" },
  disabledBtn: { backgroundColor: "#E0E0E0", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  disabledText: { color: "#999999" },
  cancelBtn: { ...UI_STYLES.button, backgroundColor: COLORS.background, marginTop: 8 },
  cancelText: { ...UI_STYLES.body, color: COLORS.onBackground },
  skipBtn: { ...UI_STYLES.button, marginTop: 4 },
  skipText: { ...UI_STYLES.caption, color: COLORS.textMuted, fontWeight: "600" },
});
