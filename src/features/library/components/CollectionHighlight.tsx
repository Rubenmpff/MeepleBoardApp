// src/features/library/components/CollectionHighlight.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";
import { CollectionEntry, formatRelativeDate } from "../utils/collectionHelpers";

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
  const [dismissedGameId, setDismissedGameId] = React.useState<string | null>(null);

  const highlight = React.useMemo(() => pickHighlight(entries), [entries]);

  if (!highlight || highlight.gameId === dismissedGameId) return null;

  const days = formatRelativeDate(highlight.lastPlayedAt);
  const playersLabel = highlight.minPlayers && highlight.maxPlayers
    ? highlight.minPlayers === highlight.maxPlayers
      ? `${highlight.minPlayers} jogadores`
      : `${highlight.minPlayers}–${highlight.maxPlayers} jogadores`
    : null;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.dismissBtn} onPress={() => setDismissedGameId(highlight.gameId)} hitSlop={8}>
        <MaterialIcons name="close" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Text style={styles.title}>Não jogas {highlight.gameName} {days}</Text>
      {playersLabel && <Text style={styles.subtitle}>Funciona com {playersLabel}.</Text>}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => onViewGame(highlight)}>
          <Text style={styles.secondaryText}>Ver jogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => onRegisterMatch(highlight)}>
          <Text style={styles.primaryText}>Registar partida</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary + "0D", borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primary + "25",
  },
  dismissBtn: { position: "absolute", top: 10, right: 10, padding: 2 },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.onBackground, paddingRight: 20 },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: COLORS.surface },
  secondaryText: { fontSize: 12, fontWeight: "700", color: COLORS.onBackground },
  primaryBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: COLORS.primary },
  primaryText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});