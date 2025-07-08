import React, { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import Toast from "react-native-toast-message";

import gameService from "../services/gameService";
import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */
type Props = {
  /** BGG ID of the base game whose expansions we want to list.                */
  baseGameId: string;

  /** List of already-selected expansions.                                     */
  selectedExpansions: Game[];

  /** Change callback (prop-drill back up).                                    */
  onChange: (newSelected: Game[]) => void;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export const ExpansionSelector = memo(
  ({ baseGameId, selectedExpansions, onChange }: Props) => {
    const [expansions, setExpansions] = useState<Game[]>([]);
    const [loading, setLoading] = useState(false);

    /* ─────────────────────────── Fetch expansions ────────────────────────── */
    useEffect(() => {
      /* Skip if the caller hasn’t provided a valid ID yet. */
      if (!baseGameId) {
        setExpansions([]);
        return;
      }

      const fetch = async () => {
        setLoading(true);
        try {
          const raw: GameSuggestion[] =
            await gameService.getExpansionsOfBase(baseGameId);

          /* Normalise data for the UI layer. */
          const mapped: Game[] = raw.map((exp) => ({
            id: exp.bggId?.toString() ?? `exp-${exp.name}`,
            name: exp.name,
            bggId: exp.bggId,
            imageUrl: exp.imageUrl,
          }));

          setExpansions(mapped);
          console.log(
            `[ExpansionSelector] Loaded ${mapped.length} expansions for base ID ${baseGameId}`,
          );
        } catch (err) {
          console.error("❌ Error fetching expansions:", err);
          Toast.show({
            type: "error",
            text1: "Couldn’t load expansions",
            text2: "Please check your connection and try again.",
          });
          setExpansions([]);
        } finally {
          setLoading(false);
        }
      };

      fetch();
    }, [baseGameId]);

    /* ───────────────────────── Toggle selection ──────────────────────────── */
    const toggleExpansion = useCallback(
      (expansion: Game) => {
        const alreadySelected = selectedExpansions.some(
          (e) => e.id === expansion.id,
        );

        const updated = alreadySelected
          ? selectedExpansions.filter((e) => e.id !== expansion.id)
          : [...selectedExpansions, expansion];

        onChange(updated);
      },
      [selectedExpansions, onChange],
    );

    /* ─────────────────────────── Render item ─────────────────────────────── */
    const renderItem = ({ item }: { item: Game }) => {
      const isSelected = selectedExpansions.some((e) => e.id === item.id);

      return (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Toggle expansion ${item.name}`}
          onPress={() => toggleExpansion(item)}
          style={[
            styles.expansionItem,
            isSelected && styles.selectedItem,
          ]}
        >
          {Boolean(item.imageUrl) && (
            <Image source={{ uri: item.imageUrl! }} style={styles.image} />
          )}

          {/* Game name – always wrap raw strings in <Text>. */}
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>

          {isSelected && <Text style={styles.checkmark}>✅</Text>}
        </TouchableOpacity>
      );
    };

    /* ---------------------------------------------------------------------- */
    return (
      <View style={{ marginTop: 16 }}>
        <Text style={styles.label}>Expansions used</Text>

        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <FlatList
            data={expansions}
            keyExtractor={(g) => g.id}
            renderItem={renderItem}
            style={{ maxHeight: 250 }}
            contentContainerStyle={{ paddingBottom: 10 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No expansions found for this game.
              </Text>
            }
          />
        )}
      </View>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  label: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  expansionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  selectedItem: {
    borderColor: "#007bff",
    backgroundColor: "#eaf3ff",
  },
  image: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 4,
  },
  name: {
    flex: 1,
    color: "#222",
  },
  checkmark: {
    fontSize: 16,
    color: "green",
    fontWeight: "bold",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});
