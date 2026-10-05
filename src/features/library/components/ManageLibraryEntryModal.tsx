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
import { COLORS } from "@/src/constants/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
  /** Se já tiveres a entrada da biblioteca à mão (ex: vindo do MyLibraryScreen),
   * passa-a aqui — evita ter de andar à procura dela outra vez. */
  entry?: UserGameLibrary;
};

const STATUS_OPTIONS: { value: GameLibraryStatus; label: string; icon: string }[] = [
  { value: GameLibraryStatus.Owned, label: "Tenho o jogo", icon: "📦" },
  { value: GameLibraryStatus.Wishlist, label: "Quero jogar", icon: "❤️" },
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

  // Sincroniza os campos sempre que o modal abre com uma entrada diferente
  React.useEffect(() => {
    if (visible && entry) {
      setStatus(entry.status);
      setPriceText(entry.pricePaid != null ? String(entry.pricePaid) : "");
    }
  }, [visible, entry?.id]);

  const handleSave = useCallback(async () => {
    if (!entry) return;
    const parsedPrice = priceText.trim() === "" ? undefined : Number(priceText.replace(",", "."));
    if (parsedPrice !== undefined && (isNaN(parsedPrice) || parsedPrice < 0)) {
      Toast.show({ type: "error", text1: "Preço inválido" });
      return;
    }

    setSaving(true);
    try {
      await updateGame(entry.gameId, status, parsedPrice);
      Toast.show({ type: "success", text1: "Biblioteca atualizada!" });
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar jogo na biblioteca:", error);
      Toast.show({ type: "error", text1: "Não foi possível guardar as alterações." });
    } finally {
      setSaving(false);
    }
  }, [entry, status, priceText, updateGame, onClose]);

  const handleRemove = useCallback(() => {
    if (!isValidGame || !game.id) return;

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
              await removeGame(game.id!);
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
  }, [game, isValidGame, onClose, removeGame, t]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {isValidGame ? game.name : t("manageModal.invalid")}
          </Text>

          {isValidGame && entry && (
            <>
              <Text style={styles.sectionLabel}>Estado</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = status === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.statusPill, active && styles.statusPillActive]}
                      onPress={() => setStatus(opt.value)}
                    >
                      <Text style={styles.statusIcon}>{opt.icon}</Text>
                      <Text style={[styles.statusText, active && styles.statusTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {status === GameLibraryStatus.Owned && (
                <>
                  <Text style={styles.sectionLabel}>Quanto pagaste (opcional)</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={priceText}
                    onChangeText={setPriceText}
                    placeholder="0.00"
                    placeholderTextColor="#bbb"
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <Pressable
                style={[styles.button, styles.save, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.buttonText}>Guardar alterações</Text>}
              </Pressable>
            </>
          )}

          <View style={styles.actions}>
            {isValidGame && (
              <Pressable
                style={[styles.button, styles.remove]}
                onPress={handleRemove}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{t("manageModal.remove")}</Text>
              </Pressable>
            )}

            <Pressable style={[styles.button, styles.close]} onPress={onClose}>
              <Text style={styles.buttonText}>{t("manageModal.close")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modal: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, width: "88%", maxWidth: 420 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 16, color: "#222222" },

  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#555", marginBottom: 8 },

  statusRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  statusPill: {
    flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fafafa", gap: 2,
  },
  statusPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "14" },
  statusIcon: { fontSize: 16 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#999", textAlign: "center" },
  statusTextActive: { color: COLORS.primary },

  priceInput: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10,
    fontSize: 15, marginBottom: 16, backgroundColor: "#fafafa", color: "#222",
  },

  actions: { flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 10, marginTop: 8 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  close: { backgroundColor: "#1E90FF" },
  remove: { backgroundColor: "#CC0000" },
  save: { backgroundColor: COLORS.success ?? "#2e7d32", width: "100%" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
});