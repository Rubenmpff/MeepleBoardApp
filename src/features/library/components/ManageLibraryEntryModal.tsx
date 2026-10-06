import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import DialogSurface from "@/src/components/ui/DialogSurface";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { Game } from "@/src/features/games/catalog/types/Game";
import { GameSuggestion } from "@/src/features/games/catalog/types/GameSuggestion";
import { useLibraryActions } from "@/src/features/library/hooks/useLibraryActions";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { UserGameLibrary } from "@/src/features/library/types/UserGameLibrary";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { parsePurchasePrice } from "../utils/purchasePrice";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
  /** Se já tiveres a entrada da biblioteca à mão (ex: vindo do MyLibraryScreen),
   * passa-a aqui — evita ter de andar à procura dela outra vez. */
  entry?: UserGameLibrary;
};

const STATUS_OPTIONS: { value: GameLibraryStatus; label: string; icon: string }[] = [
  { value: GameLibraryStatus.Owned, label: "ownedOption", icon: "📦" },
  { value: GameLibraryStatus.Wishlist, label: "wishlistOption", icon: "❤️" },
];

export default function ManageLibraryEntryModal({ visible, onClose, game, entry: entryProp }: Props) {
  const { t } = useTranslation("library");
  const { removeGame, updateGame, loading } = useLibraryActions();
  const library = useSelector((state: RootState) => state.library.items);

  const isValidGame = Boolean(game?.id || game?.bggId);

  // Se não vier a entrada diretamente, tenta encontrá-la na biblioteca (fallback)
  const foundEntry = useMemo(() => {
    if (entryProp) return entryProp;
    return library.find((e) => {
      const entryGameId = e.gameId ?? e.game?.id ?? "";
      const entryBggId = e.bggId ?? e.game?.bggId;
      const gameId = "id" in game ? game.id ?? "" : "";
      const gameBggId = game.bggId;
      return (entryGameId && gameId && entryGameId === gameId) ||
        (entryBggId && gameBggId && entryBggId === gameBggId);
    });
  }, [library, game, entryProp]);

  const entry = entryProp ?? foundEntry;

  const [status, setStatus] = useState<GameLibraryStatus>(entry?.status ?? GameLibraryStatus.Owned);
  const [priceText, setPriceText] = useState(entry?.pricePaid != null ? String(entry.pricePaid) : "");
  const [saving, setSaving] = useState(false);

  const navigationGuard = useUnsavedChanges(visible && (status !== (entry?.status ?? GameLibraryStatus.Owned) || priceText !== (entry?.pricePaid != null ? String(entry.pricePaid) : "")), visible && saving);
  const requestClose = () => navigationGuard.discard(onClose);

  // Sincroniza os campos sempre que o modal abre com uma entrada diferente
  React.useEffect(() => {
    if (visible && entry) {
      setStatus(entry.status);
      setPriceText(entry.pricePaid != null ? String(entry.pricePaid) : "");
    }
  }, [visible, entry?.id, entry?.status, entry?.pricePaid]);

  const handleSave = useCallback(async () => {
    if (!entry) return;
    let parsedPrice: number | null;
    try { parsedPrice = parsePurchasePrice(priceText); } catch {
      Toast.show({ type: "error", text1: t("ui.invalidPrice") });
      return;
    }

    setSaving(true);
    try {
      await updateGame(entry.gameId, status, parsedPrice);
      Toast.show({ type: "success", text1: t("ui.updated") });
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar jogo na biblioteca:", error);
      Toast.show({ type: "error", text1: t("ui.saveError") });
    } finally {
      setSaving(false);
    }
  }, [entry, status, priceText, updateGame, onClose, t]);

  const handleRemove = useCallback(() => {
    if (!isValidGame || !entry?.gameId) return;

    Alert.alert(
      t("manageModal.confirmTitle"),
      t("manageModal.confirmMessage", { name: game.name }),
      [
        { text: t("manageModal.cancel"), style: "cancel" },
        {
          text: t("manageModal.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await removeGame(entry.gameId);
              Toast.show({ type: "success", text1: t("manageModal.success", { name: game.name }) });
              onClose();
            } catch (error) {
              console.error("Erro ao remover jogo:", error);
              Toast.show({
                type: "error",
                text1: t("manageModal.errorTitle"),
                text2: t("manageModal.errorDescription"),
              });
            }
          },
        },
      ]
    );
  }, [game, entry?.gameId, isValidGame, onClose, removeGame, t]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={requestClose}>
      <DialogSurface>
        <Text style={styles.title}>
          {isValidGame ? game.name : t("manageModal.invalid")}
        </Text>

        {isValidGame && entry && (
          <>
            <Text style={styles.sectionLabel}>{t("ui.status")}
            </Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => {
                const active = status === opt.value;
                return (
                  <Pressable
                    disabled={saving}
                    key={opt.value} accessibilityRole="radio" accessibilityState={{ checked: active }} accessibilityLabel={t(`ui.${opt.label}`)}
                    style={[styles.statusPill, active && styles.statusPillActive]}
                    onPress={() => setStatus(opt.value)}
                  >
                    <Text style={styles.statusIcon}>{opt.icon}</Text>
                    <Text style={[styles.statusText, active && styles.statusTextActive]}>
                      {t(`ui.${opt.label}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {status === GameLibraryStatus.Owned && (
              <>
                <Text style={styles.sectionLabel}>{t("ui.price")}
                </Text>
                <TextInput
                  style={styles.priceInput} accessibilityLabel={t("ui.price")}
                  value={priceText}
                  onChangeText={setPriceText}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  editable={!saving}
                />
                <Text style={UI_STYLES.muted}>{t("ui.priceHelp")}</Text>
              </>
            )}

            <Pressable
              style={[styles.button, styles.save, saving && { opacity: 0.6 }]}
              onPress={handleSave} accessibilityRole="button" accessibilityLabel={t("ui.save")} accessibilityState={{ disabled: saving, busy: saving }}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.buttonText}>{t("ui.save")}
                </Text>}
            </Pressable>
          </>
        )}

        <View style={styles.actions}>
          {isValidGame && (
            <Pressable
              style={[styles.button, styles.remove]}
              onPress={handleRemove} accessibilityRole="button" accessibilityLabel={t("manageModal.remove")}
              disabled={loading || saving}
            >
              <Text style={styles.buttonText}>{t("manageModal.remove")}</Text>
            </Pressable>
          )}

          <Pressable style={[styles.button, styles.close]} onPress={requestClose} accessibilityRole="button" accessibilityLabel={t("manageModal.close")}>
            <Text style={styles.buttonText}>{t("manageModal.close")}</Text>
          </Pressable>
        </View>
      </DialogSurface>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { ...UI_STYLES.section, textAlign: "center", marginBottom: 16 },

  sectionLabel: { ...UI_STYLES.body, fontWeight: "700", color: "#555", marginBottom: 8 },

  statusRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  statusPill: {
    ...UI_STYLES.control,
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    gap: 2,
  },
  statusPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "14" },
  statusIcon: { fontSize: 16 },
  statusText: { ...UI_STYLES.muted, fontWeight: "700", textAlign: "center" },
  statusTextActive: { color: COLORS.primary },

  priceInput: { ...UI_STYLES.field, marginBottom: 16 },

  actions: { flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 10, marginTop: 8 },
  button: { ...UI_STYLES.button, flexGrow: 1 },
  close: { backgroundColor: COLORS.primary },
  remove: { backgroundColor: "#CC0000" },
  save: { backgroundColor: COLORS.success, width: "100%", flexGrow: 0 },
  buttonText: { ...UI_STYLES.body, color: "#FFFFFF", fontWeight: "700" },
});
