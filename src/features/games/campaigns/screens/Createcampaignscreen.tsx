/**
 * CreateCampaignScreen.tsx
 *
 * Rota:
 * /(app)/games/campaigns/create?gameId=...&gameName=...
 */
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
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
    <ScreenLayout title={t("create.title")} keyboard>
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {selectedGame ? (
            <TouchableOpacity
              style={styles.gameChip}
              onPress={handleRemoveSelectedGame}
              disabled={Boolean(paramGameId)}
              activeOpacity={
                paramGameId ? 1 : 0.75
              } accessibilityRole="button" accessibilityLabel={t("ui.changeGame")}
            >
              <MaterialIcons
                name="sports-esports"
                size={14}
                color={COLORS.primary}
              />
              <Text
                style={styles.gameChipText}
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
            <GameSelector appearance="refresh"
              onSelect={handleSelectGame}
            />
          </View>
        )}
        {selectedGame && !selectedGame.supportsCampaign && (
          <View style={styles.warningBanner}>
            <MaterialIcons name="info-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.warningBannerText}>
              {t("create.notCampaignGameWarning")}
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
                  placeholderTextColor={COLORS.textMuted}
                  maxLength={100}
                  autoCapitalize="sentences"
                  returnKeyType="next" accessibilityLabel={t("create.name")}
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
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={1000}
                  autoCapitalize="sentences" accessibilityLabel={t("create.notes")}
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
          <PrimaryButton title={t("create.button")} onPress={handleSave} disabled={!canSave} loading={saving} />
        </View>
      )}
    </ScreenLayout>
  );
}
const styles = StyleSheet.create({
  warningBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fff8e1", borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: "#ffe082",
  },
  warningBannerText: { ...UI_STYLES.body, color: "#856404", flex: 1 },
  scroll: {
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  gameChip: { ...UI_STYLES.control, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, backgroundColor: COLORS.primarySoft },
  gameChipText: { ...UI_STYLES.body, color: COLORS.primary, flexShrink: 1 },
  card: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitleText: { ...UI_STYLES.section, flexShrink: 1 },
  field: {
    marginBottom: 12,
  },
  fieldLabel: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", marginBottom: 8 },
  fieldError: { ...UI_STYLES.caption, color: COLORS.error, marginTop: 4 },
  fieldHint: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 4, textAlign: "right" },
  input: { ...UI_STYLES.field },
  inputError: {
    borderColor: COLORS.error,
  },
  inputMultiline: { minHeight: 120, textAlignVertical: "top" },
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
  infoText: { ...UI_STYLES.body, color: COLORS.textMuted, flex: 1 },
  bottomSpacer: { height: 16 },
  stickyBar: { padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
});