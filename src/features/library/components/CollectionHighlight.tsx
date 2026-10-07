import { translatedRelativeDate } from "../utils/translatedRelativeDate";
import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionHighlight.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";
import { CollectionEntry } from "../utils/collectionHelpers";

const STALE_DAYS_THRESHOLD = 21;

type Props = {
  entries: CollectionEntry[];
  onViewGame: (entry: CollectionEntry) => void;
  onRegisterMatch: (entry: CollectionEntry) => void;
};

/** Jogo que tens, já jogaste antes, mas há mais tempo do que os outros. */
function pickHighlight(entries: CollectionEntry[]): CollectionEntry | null {
  const candidates = entries.filter(
    (e) => e.status != null && e.timesPlayed > 0 && e.lastPlayedAt
  );
  if (candidates.length === 0) return null;

  let stalest: CollectionEntry | null = null;
  let stalestDays = -1;

  for (const e of candidates) {
    const days = Math.floor((Date.now() - new Date(e.lastPlayedAt!).getTime()) / (1000 * 60 * 60 * 24));
    if (days > stalestDays) {
      stalestDays = days;
      stalest = e;
    }
  }

  if (stalestDays < STALE_DAYS_THRESHOLD) return null; // não há nada relevante a sugerir
  return stalest;
}

export function CollectionHighlight({ entries, onViewGame, onRegisterMatch }: Props) {
  const { t: uiT } = useTranslation("library");
  const [dismissedGameId, setDismissedGameId] = React.useState<string | null>(null);

  const highlight = React.useMemo(() => pickHighlight(entries), [entries]);

  if (!highlight || highlight.gameId === dismissedGameId) return null;

  const days = translatedRelativeDate(highlight.lastPlayedAt, uiT);
  const playersLabel = highlight.minPlayers && highlight.maxPlayers
    ? highlight.minPlayers === highlight.maxPlayers
      ? `${highlight.minPlayers}`
      : `${highlight.minPlayers}–${highlight.maxPlayers}`
    : null;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.dismissBtn} accessibilityRole="button" accessibilityLabel={uiT("ui.dismiss")} onPress={() => setDismissedGameId(highlight.gameId)} hitSlop={8}>
        <MaterialIcons name="close" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Text style={styles.title}>{uiT("ui.highlight", { name: highlight.gameName, days })}
      </Text>
      {playersLabel && <Text style={styles.subtitle}>{uiT("ui.highlightPlayers", { range: playersLabel })}
      </Text>}

      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" style={styles.secondaryBtn} onPress={() => onViewGame(highlight)}>
          <Text style={styles.secondaryText}>{uiT("ui.viewGame")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.primaryBtn} onPress={() => onRegisterMatch(highlight)}>
          <Text style={styles.primaryText}>{uiT("ui.register")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary + "0D",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },
  dismissBtn: { position: "absolute", top: 4, right: 4, ...UI_STYLES.iconButton },
  title: { ...UI_STYLES.section, paddingRight: 40 },
  subtitle: { ...UI_STYLES.muted, marginTop: 3 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  secondaryBtn: { ...UI_STYLES.button, backgroundColor: COLORS.surface },
  secondaryText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.onBackground },
  primaryBtn: { ...UI_STYLES.button, backgroundColor: COLORS.primary },
  primaryText: { ...UI_STYLES.caption, fontWeight: "700", color: "#fff" },
});
