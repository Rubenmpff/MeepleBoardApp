import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import DialogSurface from "@/src/components/ui/DialogSurface";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { Game } from "@/src/features/games/catalog/types/Game";
import { GameSuggestion } from "@/src/features/games/catalog/types/GameSuggestion";
import Toast from "react-native-toast-message";
import { parsePurchasePrice } from "../utils/purchasePrice";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
  onAddToLibrary: (pricePaid?: number) => void | Promise<void>;
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
  const [saving, setSaving] = useState(false);

  const navigationGuard = useUnsavedChanges(visible && !!price, saving);
  const requestClose = () => navigationGuard.discard(handleClose);

  async function save(value?: number) {
    if (saving) return;
    setSaving(true);
    try {
      await onAddToLibrary(value);
      handleClose();
    } catch {
      Toast.show({ type: "error", text1: t("ui.addError") });
    } finally { setSaving(false); }
  }

  async function handleConfirm() {
    let value: number | null;
    try { value = parsePurchasePrice(price); } catch {
      Toast.show({ type: "error", text1: t("ui.invalidPrice") });
      return;
    }
    await save(value ?? undefined);
  }

  async function handleSkip() {
    await save();
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
      onRequestClose={requestClose}
    >
      <DialogSurface>
        {step === "price" && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep("options")} disabled={saving}
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

            <TouchableOpacity style={styles.cancelBtn} onPress={requestClose} accessibilityRole="button" accessibilityLabel={t("addModal.cancel")}>
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
              editable={!saving}
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.note}>
              {t("ui.priceHelp")}
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              disabled={saving} accessibilityState={{ disabled: saving, busy: saving }}
              onPress={handleConfirm} accessibilityRole="button" accessibilityLabel={t("addModal.confirm")}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" accessibilityLabel={t("common:loading")} /> : <Text style={styles.primaryBtnText}>
                {t("addModal.confirm")}
              </Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} disabled={saving} onPress={handleSkip} accessibilityRole="button" accessibilityLabel={t("addModal.skip")}>
              <Text style={styles.skipText}>
                {t("addModal.skip", { defaultValue: "Skip" })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={requestClose} accessibilityRole="button" accessibilityLabel={t("addModal.cancel")}>
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
