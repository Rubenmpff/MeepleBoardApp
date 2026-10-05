/**
 * CreateCampaignScreen.tsx
 *
 * Rota:
 * /(app)/games/campaigns/create?gameId=...&gameName=...
 */

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";
import { GameSelector } from "@/src/features/games/catalog/components/GameSelector";
import { Game } from "@/src/features/games/catalog/types/Game";
import campaignService from "@/src/features/games/campaigns/services/campaignService";

export default function CreateCampaignScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation("campaigns");

  const paramGameId =
    typeof params.gameId === "string"
      ? params.gameId
      : "";

  const paramGameName =
    typeof params.gameName === "string"
      ? decodeURIComponent(params.gameName)
      : "";

  const [selectedGame, setSelectedGame] =
    useState<Game | null>(
      paramGameId
        ? ({
            id: paramGameId,
            name: paramGameName,
          } as Game)
        : null
    );

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const gameId = selectedGame?.id ?? "";
  const gameName = selectedGame?.name ?? "";

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedGame(null);
        setName("");
        setNotes("");
        setSaving(false);
      };
    }, [])
  );

  const trimmedName = name.trim();
  const trimmedNotes = notes.trim();

  const nameError =
    trimmedName.length > 0 && trimmedName.length < 2
      ? t("create.nameMinimum")
      : null;

  const canSave =
    trimmedName.length >= 2 &&
    Boolean(gameId) &&
    !saving;

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
  };

  const handleRemoveSelectedGame = () => {
    if (paramGameId) {
      return;
    }

    setSelectedGame(null);
  };

  const handleSave = async () => {
    if (!gameId) {
      Alert.alert(
        t("create.missingGameTitle"),
        t("create.missingGameMessage")
      );

      return;
    }

    if (!canSave) {
      return;
    }

    setSaving(true);

    try {
      const created = await campaignService.create({
        name: trimmedName,
        gameId,
        notes: trimmedNotes || undefined,
      });

      Alert.alert(
        t("create.successTitle"),
        t("create.successMessage"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              router.replace({
                pathname:
                  "/(app)/games/campaigns/[id]" as any,
                params: {
                  id: created.id,
                },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "❌ Failed to create campaign:",
        error
      );

      const apiMessage =
        error?.response?.data?.message;

      const message =
        typeof apiMessage === "string" &&
        apiMessage.trim()
          ? apiMessage
          : t("create.errorFallback");

      Alert.alert(
        t("common.error"),
        message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("create.title")}
          </Text>

          {selectedGame ? (
            <TouchableOpacity
              style={styles.gameChip}
              onPress={handleRemoveSelectedGame}
              disabled={Boolean(paramGameId)}
              activeOpacity={
                paramGameId ? 1 : 0.75
              }
            >
              <MaterialIcons
                name="sports-esports"
                size={14}
                color={COLORS.primary}
              />

              <Text
                style={styles.gameChipText}
                numberOfLines={1}
              >
                {gameName}
              </Text>

              {!paramGameId && (
                <MaterialIcons
                  name="close"
                  size={14}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {!selectedGame && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MaterialIcons
                name="sports-esports"
                size={18}
                color={COLORS.primary}
              />

              <Text style={styles.cardTitleText}>
                {t("create.selectGame")}
              </Text>
            </View>

            <GameSelector
              onSelect={handleSelectGame}
            />
          </View>
        )}

        {selectedGame && !selectedGame.supportsCampaign && (
          <View style={styles.warningBanner}>
            <MaterialIcons name="info-outline" size={16} color="#f39c12" />
            <Text style={styles.warningBannerText}>
              {t("create.notCampaignGameWarning", {
                defaultValue:
                  "Este jogo não tem mecânica de Legacy/Campanha registada no BGG. Continua à vontade se souberes que ele suporta campanhas.",
              })}
            </Text>
          </View>
        )}

        {selectedGame && (
          <>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <MaterialIcons
                  name="flag"
                  size={18}
                  color={COLORS.primary}
                />

                <Text
                  style={styles.cardTitleText}
                >
                  {t("create.details")}
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t("create.name")}
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    nameError &&
                      styles.inputError,
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t(
                    "create.namePlaceholder"
                  )}
                  placeholderTextColor="#BBBBBB"
                  maxLength={100}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                />

                {nameError ? (
                  <Text style={styles.fieldError}>
                    {nameError}
                  </Text>
                ) : null}

                <Text style={styles.fieldHint}>
                  {name.length}/100
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t("create.notes")}
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.inputMultiline,
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t(
                    "create.notesPlaceholder"
                  )}
                  placeholderTextColor="#BBBBBB"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={1000}
                  autoCapitalize="sentences"
                />

                <Text style={styles.fieldHint}>
                  {notes.length}/1000
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <MaterialIcons
                name="info-outline"
                size={16}
                color={COLORS.primary}
              />

              <Text style={styles.infoText}>
                {t("create.information")}
              </Text>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {selectedGame && (
        <View style={styles.stickyBar}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              !canSave &&
                styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.saveBtnText}>
                  {t("create.button")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  warningBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fff8e1", borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: "#ffe082",
  },
  warningBannerText: { flex: 1, fontSize: 12, color: "#856404", lineHeight: 17 },

  scroll: {
    padding: 16,
    paddingBottom: 20,
  },

  header: {
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },

  gameChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    backgroundColor: COLORS.primary + "10",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },

  gameChipText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  cardTitleText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  field: {
    marginBottom: 12,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.onBackground,
    marginBottom: 6,
  },

  fieldError: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    fontWeight: "600",
  },

  fieldHint: {
    fontSize: 11,
    color: "#BBBBBB",
    marginTop: 4,
    textAlign: "right",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    color: COLORS.onBackground,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  inputMultiline: {
    height: 110,
    paddingTop: 10,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.primary + "0A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#555555",
    lineHeight: 18,
  },

  bottomSpacer: {
    height: 100,
  },

  stickyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom:
      Platform.OS === "ios" ? 28 : 16,
    backgroundColor:
      "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },

  saveBtnDisabled: {
    opacity: 0.45,
  },

  saveBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});