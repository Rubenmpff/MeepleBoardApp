import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import Sheet from "@/src/ui/Sheet";
import { Segmented } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { Game } from "@/src/features/games/catalog/types/Game";
import { GameSuggestion } from "@/src/features/games/catalog/types/GameSuggestion";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { parsePurchasePrice } from "../utils/purchasePrice";

type Props = {
  visible: boolean;
  onClose: () => void;
  game: Game | GameSuggestion;
  onAddToLibrary: (pricePaid?: number, status?: GameLibraryStatus) => void | Promise<void>;
};

// One step: choose Tenho or Quero; Tenho may record the price paid (empty = not stated, 0 = free).
// "Já joguei" is not offered: that filter is derived from recorded matches, not from this status.
export default function AddToLibraryModal({ visible, onClose, game, onAddToLibrary }: Props) {
  const { t } = useTranslation("library");
  const [status, setStatus] = useState<GameLibraryStatus>(GameLibraryStatus.Owned);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const owned = status === GameLibraryStatus.Owned;

  const navigationGuard = useUnsavedChanges(visible && !!price, saving);
  const requestClose = () => navigationGuard.discard(handleClose);

  function handleClose() { setPrice(""); setStatus(GameLibraryStatus.Owned); onClose(); }

  async function handleConfirm() {
    if (saving) return;
    let value: number | null = null;
    if (owned) {
      try { value = parsePurchasePrice(price); } catch { Toast.show({ type: "error", text1: t("ui.invalidPrice") }); return; }
    }
    setSaving(true);
    try { await onAddToLibrary(value ?? undefined, status); handleClose(); }
    catch { Toast.show({ type: "error", text1: t("ui.addError") }); }
    finally { setSaving(false); }
  }

  return <Sheet visible={visible} title={t("addModal.sheetTitle")} closeLabel={t("addModal.cancel")} onClose={requestClose}
    left={{ label: t("addModal.cancel"), onPress: requestClose }}
    right={{ label: saving ? t("addModal.adding") : t("addModal.add"), bold: true, onPress: () => { void handleConfirm(); } }}>
    <Text style={[type.head, styles.name]}>{game.name}</Text>
    <View style={styles.group}>
      <Text style={[type.caption, strong, styles.label]}>{t("addModal.statusLabel")}</Text>
      <Segmented role="button" items={[{ key: String(GameLibraryStatus.Owned), label: t("ui.owned") }, { key: String(GameLibraryStatus.Wishlist), label: t("ui.wanted") }]}
        value={String(status)} onChange={key => setStatus(Number(key) as GameLibraryStatus)} />
    </View>
    {owned && <View style={styles.group}>
      <Text style={[type.caption, strong, styles.label]}>{t("addModal.priceLabel")}</Text>
      <TextInput style={[type.body, styles.input]} accessibilityLabel={t("addModal.priceLabel")} placeholder={t("addModal.pricePlaceholder")} value={price}
        onChangeText={setPrice} keyboardType="decimal-pad" editable={!saving} placeholderTextColor={colors.muted} />
      <Text style={type.caption}>{t("ui.priceHelp")}</Text>
    </View>}
    <Text style={type.caption}>{t("addModal.laterNote")}</Text>
  </Sheet>;
}

const styles = StyleSheet.create({
  name: { textAlign: "center" },
  group: { gap: space.xs },
  label: { color: colors.text, marginLeft: space.xs },
  input: { minHeight: touch, borderWidth: 1, borderColor: colors.field, borderRadius: radius.control, backgroundColor: colors.card, paddingHorizontal: space.md, color: colors.text },
});
