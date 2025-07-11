import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";
import { COLORS } from "@/src/constants/colors";

type Props = {
  game: Game | GameSuggestion;
  inLibrary: boolean;
  onPress?: () => void;
  onAdd?: () => void;
  onManageLibrary?: () => void;
};

export function GameListItem({
  game,
  inLibrary,
  onPress,
  onAdd,
  onManageLibrary,
}: Props) {
  const name = game.name ?? "Unknown Game";
  const imageUrl = game.imageUrl ?? null;
  const bggId = game.bggId ?? null;

  const handleAdd = () => {
    if (!bggId) {
      console.warn("⚠️ Game has no BGG ID and cannot be imported.");
      return;
    }
    onAdd?.();
  };

  console.log("🧩 GameListItem →", {
    name,
    gameId: "id" in game ? game.id : null,
    bggId,
    inLibrary,
  });

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View details of ${name}`}
    >
      {!!imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.thumb} />
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        {"bggRanking" in game &&
          typeof game.bggRanking === "number" &&
          game.bggRanking > 0 && (
            <Text style={styles.rank}>BGG #{game.bggRanking}</Text>
          )}
      </View>

      {inLibrary ? (
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={onManageLibrary}
          accessibilityRole="button"
          accessibilityLabel={`Manage ${name}`}
        >
          <Text style={styles.manageTxt}>⋯</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel={`Add ${name} to library`}
        >
          <Text style={styles.addTxt}>＋</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    color: COLORS.onBackground,
  },
  rank: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  addTxt: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  manageBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  manageTxt: {
    color: "#333",
    fontSize: 20,
    fontWeight: "bold",
  },
});
