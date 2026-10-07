import SheetSurface from "@/src/components/ui/SheetSurface";
import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionGameActionsSheet.tsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";
import { ROUTES } from "@/src/constants/routes";
import { useLibraryActions } from "../hooks/useLibraryActions";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { CollectionEntry } from "../utils/collectionHelpers";

type Props = {
  visible: boolean;
  entry: CollectionEntry | null;
  onClose: () => void;
  onEdit: (entry: CollectionEntry) => void; // abre o ManageLibraryEntryModal (já existe)
};

type ActionItem = {
  key: string;
  label: string;
  icon: string;
  danger?: boolean;
  onPress: () => void | Promise<void>;
};

export function CollectionGameActionsSheet({ visible, entry, onClose, onEdit }: Props) {
  const { t: uiT } = useTranslation("library");
  const { addGame, updateGame, removeGame } = useLibraryActions();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      try {
        await fn();
        onClose();
      } catch (err) {
        console.error("Erro na ação da coleção:", err);
        Toast.show({ type: "error", text1: uiT("ui.actionError") });
      } finally {
        setBusy(false);
      }
    },
    [onClose, uiT]
  );

  if (!entry) return null;

  const isOwned = entry.status === GameLibraryStatus.Owned;
  const isWishlist = entry.status === GameLibraryStatus.Wishlist;
  const inLibrary = isOwned || isWishlist;

  const actions: ActionItem[] = [];

  actions.push({
    key: "view",
    label: uiT("ui.viewPage"),
    icon: "info-outline",
    onPress: () => {
      router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: entry.gameId } });
      onClose();
    },
  });

  actions.push({
    key: "register",
    label: entry.timesPlayed > 0 ? uiT("ui.register") : uiT("ui.registerFirst"),
    icon: "add-circle-outline",
    onPress: () => {
      // ⚠️ Dependência: ainda não pré-seleciona o jogo (ver Fase 1)
      router.push(ROUTES.REGISTER_MATCH as any);
      onClose();
    },
  });

  if (isOwned) {
    actions.push({
      key: "edit",
      label: uiT("ui.editEntry"),
      icon: "edit",
      onPress: () => { onEdit(entry); onClose(); },
    });
    actions.push({
      key: "toWishlist",
      label: uiT("ui.moveWishlist"),
      icon: "favorite-border",
      onPress: () => run(() => updateGame(entry.gameId, GameLibraryStatus.Wishlist, undefined)),
    });
    actions.push({
      key: "remove",
      label: uiT("ui.removeCollection"),
      icon: "delete-outline",
      danger: true,
      onPress: () =>
        Alert.alert(uiT("ui.removeTitle"), uiT("ui.removeConfirm", { name: entry.gameName }), [
          { text: uiT("ui.cancel"), style: "cancel" },
          { text: uiT("ui.remove"), style: "destructive", onPress: () => run(() => removeGame(entry.gameId)) },
        ]),
    });
  } else if (isWishlist) {
    actions.push({
      key: "toOwned",
      label: uiT("ui.addCollection"),
      icon: "library-add",
      onPress: () => run(() => updateGame(entry.gameId, GameLibraryStatus.Owned, undefined)),
    });
    actions.push({
      key: "removeWishlist",
      label: uiT("ui.removeWishlist"),
      icon: "delete-outline",
      danger: true,
      onPress: () => run(() => removeGame(entry.gameId)),
    });
  } else {
    // Só jogado, nunca esteve na biblioteca
    actions.push({
      key: "addOwned",
      label: uiT("ui.addCollection"),
      icon: "library-add",
      onPress: () =>
        run(() =>
          addGame(
            { id: entry.gameId, name: entry.gameName, imageUrl: entry.gameImageUrl } as any,
            GameLibraryStatus.Owned
          )
        ),
    });
    actions.push({
      key: "addWishlist",
      label: uiT("ui.addWishlist"),
      icon: "favorite-border",
      onPress: () =>
        run(() =>
          addGame(
            { id: entry.gameId, name: entry.gameName, imageUrl: entry.gameImageUrl } as any,
            GameLibraryStatus.Wishlist
          )
        ),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <SheetSurface style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={1}>{entry.gameName}</Text>

          {busy ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={COLORS.primary} />
          ) : (
            actions.map((action) => (
              <Pressable
                key={action.key} accessibilityRole="button" accessibilityLabel={action.label}
                style={styles.row}
                onPress={action.onPress}
                android_ripple={{ color: COLORS.border }}
              >
                <MaterialIcons
                  name={action.icon as any}
                  size={20}
                  color={action.danger ? COLORS.error : COLORS.onBackground}
                />
                <Text style={[styles.rowText, action.danger && { color: COLORS.error }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))
          )}
        </SheetSurface>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 12 },
  title: { ...UI_STYLES.section, marginBottom: 8, paddingHorizontal: 4 },
  row: { ...UI_STYLES.control, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingHorizontal: 4 },
  rowText: { ...UI_STYLES.body, fontWeight: "600", color: COLORS.onBackground },
});
