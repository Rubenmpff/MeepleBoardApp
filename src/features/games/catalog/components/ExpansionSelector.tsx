import { UI_STYLES } from "@/src/styles/uiStyles";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import { COLORS } from "@/src/constants/colors";
import gameService from "../services/gameService";
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";

type Props = {
  appearance?: "default" | "refresh";
  baseGameId: string;
  selectedExpansions: Game[];
  onChange: (newSelected: Game[]) => void;
};

export const ExpansionSelector = memo(
  ({ baseGameId, selectedExpansions, onChange, appearance = "default" }: Props) => {
    const { t } = useTranslation("games");
    const [expansions, setExpansions] = useState<Game[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      let mounted = true;

      if (!baseGameId) {
        setExpansions([]);
        return;
      }

      async function loadExpansions() {
        setLoading(true);

        try {
          const raw: GameSuggestion[] =
            await gameService.getExpansionsOfBase(baseGameId);

          const mapped: Game[] = raw.map((expansion) => ({
            id:
              expansion.bggId?.toString() ??
              `exp-${expansion.name}`,
            name: expansion.name,
            bggId: expansion.bggId,
            imageUrl: expansion.imageUrl,
          }));

          if (mounted) {
            setExpansions(mapped);
          }
        } catch (error) {
          console.error("Erro ao carregar expansões:", error);

          Toast.show({
            type: "error",
            text1: t("expansions.loadErrorTitle"),
            text2: t("expansions.loadErrorDescription"),
          });

          if (mounted) {
            setExpansions([]);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }

      void loadExpansions();

      return () => {
        mounted = false;
      };
    }, [baseGameId, t]);

    const toggleExpansion = useCallback(
      (expansion: Game) => {
        const isSelected = selectedExpansions.some(
          (selected) => selected.id === expansion.id
        );

        onChange(
          isSelected
            ? selectedExpansions.filter(
                (selected) => selected.id !== expansion.id
              )
            : [...selectedExpansions, expansion]
        );
      },
      [onChange, selectedExpansions]
    );

    return (
      <View style={styles.container}>
        <Text style={[styles.label, appearance === "refresh" && UI_STYLES.body]}>{t("expansions.title")}</Text>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : expansions.length === 0 ? (
          <Text style={styles.emptyText}>{t("expansions.empty")}</Text>
        ) : (
          <ScrollView
            style={styles.list}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {expansions.map((item) => {
              const isSelected = selectedExpansions.some(
                (selected) => selected.id === item.id
              );

              return (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={t(
                    "expansions.toggleAccessibility",
                    { name: item.name }
                  )}
                  onPress={() => toggleExpansion(item)}
                  style={[
                    styles.expansionItem,
                    appearance === "refresh" && { ...UI_STYLES.card, minHeight: 64, padding: 12 },
                    isSelected && styles.selectedItem,
                  ]}
                >
                  {!!item.imageUrl && (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.image}
                    />
                  )}

                  <Text style={[styles.name, appearance === "refresh" && UI_STYLES.body]} numberOfLines={appearance === "refresh" ? undefined : 1}>
                    {item.name}
                  </Text>

                  {isSelected && (
                    <Text style={styles.checkmark}>✅</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  }
);

ExpansionSelector.displayName = "ExpansionSelector";

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  label: {
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.onBackground,
  },
  list: { maxHeight: 250 },
  expansionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: COLORS.surface,
  },
  selectedItem: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}12`,
  },
  image: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 4,
  },
  name: { flex: 1, color: COLORS.onBackground },
  checkmark: { fontSize: 16, fontWeight: "700" },
  emptyText: {
    fontStyle: "italic",
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
});
