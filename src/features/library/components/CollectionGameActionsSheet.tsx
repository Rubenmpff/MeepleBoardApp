import Sheet from "@/src/ui/Sheet";
import { Card, Glyph, Row } from "@/src/ui/components";
import { colors } from "@/src/ui/theme";
import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionGameActionsSheet.tsx
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

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
  const { t: tc } = useTranslation("common");
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
    icon: "information-outline",
    onPress: () => {
      router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: entry.gameId } });
      onClose();
    },
  });

  actions.push({
    key: "register",
    label: entry.timesPlayed > 0 ? uiT("ui.register") : uiT("ui.registerFirst"),
    icon: "plus-circle-outline",
    onPress: () => {
      router.push({ pathname: ROUTES.REGISTER_MATCH, params: { gameId: entry.gameId } } as never);
      onClose();
    },
  });

  if (isOwned) {
    actions.push({
      key: "edit",
      label: uiT("ui.editEntry"),
      icon: "pencil-outline",
      onPress: () => { onEdit(entry); onClose(); },
    });
    actions.push({
      key: "toWishlist",
      label: uiT("ui.moveWishlist"),
      icon: "heart-outline",
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
      icon: "bookshelf",
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
      icon: "bookshelf",
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
      icon: "heart-outline",
      onPress: () =>
        run(() =>
          addGame(
            { id: entry.gameId, name: entry.gameName, imageUrl: entry.gameImageUrl } as any,
            GameLibraryStatus.Wishlist
          )
        ),
    });
  }

  // The common sheet: the game as title, one row per action, risky ones in red text.
  return (
    <Sheet visible={visible} title={entry.gameName} onClose={onClose} closeLabel={tc("filters.cancel")} left={{ label: tc("filters.cancel"), onPress: onClose }}>
      {busy ? <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
        : <Card>
          {actions.map((action, index) => <Row key={action.key} first={index === 0} title={action.label} tone={action.danger ? "danger" : "default"} end="none" inset={52}
            lead={<Glyph name={action.icon as any} size={20} color={action.danger ? colors.danger : colors.text} />} onPress={action.onPress} />)}
        </Card>}
    </Sheet>
  );
}

