import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";

import { COLORS } from "@/src/constants/colors";
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";

type Props = {
  game: Game | GameSuggestion;
  inLibrary: boolean;
  libraryStatus?: GameLibraryStatus;
  timesPlayed?: number;
  onPress?: () => void;
  onAdd?: () => void;
  onManageLibrary?: () => void;
};

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

function hasValidLocalId(game: Game | GameSuggestion) {
  return (
    "id" in game &&
    typeof game.id === "string" &&
    game.id.length > 0 &&
    game.id !== EMPTY_GUID
  );
}

export function GameListItem({
  game,
  inLibrary,
  libraryStatus,
  timesPlayed = 0,
  onPress,
  onAdd,
  onManageLibrary,
}: Props) {
  const { t } = useTranslation("games");

  const name = game.name ?? t("listItem.unknownGame");
  const imageUrl = game.imageUrl || null;
  const hasBggId = Boolean(game.bggId);
  const isLocalGame = hasValidLocalId(game);

  const yearPublished =
    "yearPublished" in game
      ? game.yearPublished
      : undefined;

  const averageRating =
    "averageRating" in game
      ? game.averageRating
      : undefined;

  const meepleBoardScore =
    "meepleBoardScore" in game
      ? game.meepleBoardScore
      : undefined;

  const minPlayers =
    "minPlayers" in game
      ? game.minPlayers
      : undefined;

  const maxPlayers =
    "maxPlayers" in game
      ? game.maxPlayers
      : undefined;

  const isExpansion =
    "isExpansion" in game
      ? Boolean(game.isExpansion)
      : false;

  const playersLabel = useMemo(() => {
    if (!minPlayers || !maxPlayers) {
      return null;
    }

    return minPlayers === maxPlayers
      ? `${minPlayers} jog.`
      : `${minPlayers}–${maxPlayers} jog.`;
  }, [minPlayers, maxPlayers]);

  const statusLabel = useMemo(() => {
    if (libraryStatus === GameLibraryStatus.Owned) {
      return "Tenho";
    }

    if (libraryStatus === GameLibraryStatus.Wishlist) {
      return "Quero";
    }

    return null;
  }, [libraryStatus]);

  const bggRatingLabel =
    averageRating != null && averageRating > 0
      ? averageRating.toFixed(1)
      : null;

  const meepleBoardRatingLabel =
    meepleBoardScore != null
      ? (meepleBoardScore / 10).toFixed(1)
      : null;

  function handleAdd() {
    if (!hasBggId) {
      console.warn(
        `"${name}" não tem BGG ID e não pode ser importado.`
      );
      return;
    }

    onAdd?.();
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={t(
        "listItem.viewDetailsAccessibility",
        { name }
      )}
    >
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumb}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <MaterialIcons
              name="casino"
              size={30}
              color={COLORS.textMuted}
            />
          </View>
        )}

        {inLibrary && (
          <View style={styles.libraryIndicator}>
            <MaterialIcons
              name="check"
              size={13}
              color="#FFFFFF"
            />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={styles.name}
            numberOfLines={2}
          >
            {name}
          </Text>
        </View>

        <View style={styles.badgesRow}>
          {yearPublished ? (
            <Text style={styles.yearText}>
              {yearPublished}
            </Text>
          ) : null}

          <View
            style={[
              styles.typeBadge,
              isExpansion &&
                styles.typeBadgeExpansion,
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                isExpansion &&
                  styles.typeBadgeTextExpansion,
              ]}
            >
              {isExpansion
                ? "Expansão"
                : "Jogo base"}
            </Text>
          </View>

          {isLocalGame && (
            <View style={styles.localBadge}>
              <MaterialIcons
                name="verified"
                size={11}
                color={COLORS.primary}
              />
              <Text style={styles.localBadgeText}>
                MeepleBoard
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {bggRatingLabel ? (
            <View style={styles.statItem}>
              <MaterialIcons
                name="star"
                size={14}
                color="#D99A00"
              />
              <Text style={styles.statText}>
                {bggRatingLabel} BGG
              </Text>
            </View>
          ) : (
            <Text style={styles.metaTextMuted}>
              Sem nota BGG
            </Text>
          )}

          {meepleBoardRatingLabel && (
            <View style={styles.statItem}>
              <MaterialIcons
                name="star-outline"
                size={14}
                color={COLORS.secondary}
              />
              <Text style={styles.metaTextMb}>
                {meepleBoardRatingLabel} MB
              </Text>
            </View>
          )}

          {playersLabel && (
            <View style={styles.statItem}>
              <MaterialIcons
                name="group"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.statText}>
                {playersLabel}
              </Text>
            </View>
          )}
        </View>

        {(statusLabel || timesPlayed > 0) && (
          <View style={styles.userMetaRow}>
            {statusLabel && (
              <View style={styles.statusPill}>
                <MaterialIcons
                  name={
                    libraryStatus ===
                    GameLibraryStatus.Wishlist
                      ? "favorite-border"
                      : "inventory-2"
                  }
                  size={12}
                  color={
                    COLORS.success ??
                    "#2E7D32"
                  }
                />
                <Text style={styles.statusText}>
                  {statusLabel}
                </Text>
              </View>
            )}

            {timesPlayed > 0 && (
              <View style={styles.playedPill}>
                <MaterialIcons
                  name="sports-esports"
                  size={12}
                  color={COLORS.onBackground}
                />
                <Text style={styles.playedText}>
                  {timesPlayed}{" "}
                  {timesPlayed === 1
                    ? "partida"
                    : "partidas"}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.actionColumn}>
        {inLibrary ? (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={(event) => {
              event.stopPropagation();
              onManageLibrary?.();
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t(
              "listItem.manageAccessibility",
              { name }
            )}
          >
            <MaterialIcons
              name="more-horiz"
              size={20}
              color={COLORS.onBackground}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={(event) => {
              event.stopPropagation();
              handleAdd();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t(
              "listItem.addAccessibility",
              { name }
            )}
          >
            <MaterialIcons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}

        <MaterialIcons
          name="chevron-right"
          size={20}
          color={COLORS.textMuted}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },

  imageWrapper: {
    width: 82,
    height: 82,
    marginRight: 12,
    position: "relative",
  },

  thumb: {
    width: "100%",
    height: "100%",
    borderRadius: 11,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  thumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  libraryIndicator: {
    position: "absolute",
    right: -4,
    top: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor:
      COLORS.success ?? "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  name: {
    flex: 1,
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.onBackground,
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },

  yearText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },

  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor:
      COLORS.primary + "14",
  },

  typeBadgeExpansion: {
    backgroundColor:
      COLORS.campaign + "14",
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },

  typeBadgeTextExpansion: {
    color: COLORS.campaign,
  },

  localBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.primary + "55",
    backgroundColor:
      COLORS.primary + "0D",
  },

  localBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 7,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  statText: {
    fontSize: 12,
    color: COLORS.onBackground,
    fontWeight: "600",
  },

  metaTextMb: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "800",
  },

  metaTextMuted: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  userMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 7,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor:
      (COLORS.success ?? "#2E7D32") +
      "14",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color:
      COLORS.success ?? "#2E7D32",
  },

  playedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor:
      COLORS.background,
  },

  playedText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  actionColumn: {
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  manageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  chevron: {
    marginTop: 6,
  },
});
