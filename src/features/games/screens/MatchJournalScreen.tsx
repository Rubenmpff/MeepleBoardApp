/**
 * MatchJournalScreen.tsx
 * src/features/games/screens/MatchJournalScreen.tsx
 */

import { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import matchService from "@/src/features/games/services/matchService";
import { MatchDto } from "@/src/features/games/types/MatchForm";
import { JournalEntry } from "@/src/features/games/types/Campaign";
import { StarRating } from "@/src/features/games/components/StarRating";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";

export default function MatchJournalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [match, setMatch] = useState<MatchDto | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  const myEntry = entries.find(e => e.userId === currentUser?.id);
  const alreadySubmitted = !!myEntry?.personalRating;
  const isClosed = match?.journalStatus === "Closed";

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [matchData, entriesData] = await Promise.all([
        matchService.getById(id),
        matchService.getJournalEntries(id),
      ]);
      setMatch(matchData);
      setEntries(entriesData);
      const mine = entriesData.find(e => e.userId === currentUser?.id);
      if (mine) {
        setPersonalRating(mine.personalRating ?? undefined);
        setNotes(mine.notes ?? "");
        setTags(mine.tags ?? "");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a partida.");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!id) return;
    if (personalRating === undefined) {
      Alert.alert("Rating obrigatório", "Dá uma avaliação com as estrelas para guardar.");
      return;
    }
    setSaving(true);
    try {
      await matchService.upsertJournalEntry(id, {
        personalRating,
        notes: notes.trim() || null,
        tags: tags.trim() || null,
      });
      Alert.alert("✅ Avaliação guardada!", "Os outros jogadores foram notificados.",
        [{ text: "OK", onPress: load }]);
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível guardar a avaliação.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!match) return <View style={styles.center}><Text style={styles.errorText}>Partida não encontrada.</Text></View>;

  const submittedCount = entries.filter(e => e.personalRating != null).length;
  const totalPlayers = match.players?.length ?? 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* ── Header ── */}
      <View style={styles.matchHeader}>
        <Text style={styles.gameName}>{match.gameName}</Text>
        <Text style={styles.matchDate}>
          {new Date(match.matchDate).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: isClosed ? COLORS.primary + "20" : COLORS.success + "20" }]}>
            <Text style={[styles.statusText, { color: isClosed ? COLORS.primary : COLORS.success }]}>
              {isClosed ? "🔒 Fechado" : "⏳ Aberto"}
            </Text>
          </View>
          <Text style={styles.progressText}>{submittedCount}/{totalPlayers} avaliações</Text>
        </View>
        {match.players && match.players.length > 0 && (
          <View style={styles.playersRow}>
            {match.players.map((p, i) => {
              const hasEvaluated = entries.some(e => e.userId === p.userId && e.personalRating != null);
              return (
                <View key={i} style={styles.playerChip}>
                  <View style={[styles.playerDot, { backgroundColor: hasEvaluated ? COLORS.success : "#ddd" }]} />
                  <Text style={styles.playerChipText}>{p.userName}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Avaliações dos outros ── */}
      {(isClosed || alreadySubmitted) && entries.filter(e => e.userId !== currentUser?.id && e.personalRating != null).length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="people" size={16} color={COLORS.primary} />
            <Text style={styles.cardTitle}>O que os outros acharam</Text>
          </View>
          {entries.filter(e => e.userId !== currentUser?.id && e.personalRating != null).map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryAvatar}>
                <Text style={styles.entryAvatarText}>{entry.userName[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryUserName}>{entry.userName}</Text>
                </View>
                {entry.personalRating != null && (
                  <StarRating value={entry.personalRating} readonly size={16} showLabel={false} />
                )}
                {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
                {entry.tags && (
                  <View style={styles.tagsRow}>
                    {entry.tags.split(",").map((tag, ti) => (
                      <View key={ti} style={styles.tagChip}><Text style={styles.tagChipText}>#{tag.trim()}</Text></View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Aviso fechado ── */}
      {isClosed && !alreadySubmitted && (
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={16} color="#f39c12" />
          <Text style={styles.infoText}>O diário foi fechado mas ainda podes deixar a tua avaliação!</Text>
        </View>
      )}

      {/* ── Formulário ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons name="star" size={16} color={COLORS.primary} />
          <Text style={styles.cardTitle}>{alreadySubmitted ? "A tua avaliação" : "Deixa a tua avaliação"}</Text>
        </View>

        <Text style={styles.fieldLabel}>Rating (0–10) *</Text>
        <StarRating value={personalRating} onChange={setPersonalRating} size={32} />

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notas (opcional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes} onChangeText={setNotes}
          placeholder="Momentos épicos, estratégias, o que correu bem ou mal..."
          placeholderTextColor="#bbb" multiline numberOfLines={4}
          textAlignVertical="top" maxLength={2000}
        />

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Tags (opcional, separadas por vírgula)</Text>
        <TextInput
          style={styles.tagsInput}
          value={tags} onChangeText={setTags}
          placeholder="épico, reviravolta, difícil..."
          placeholderTextColor="#bbb" maxLength={500}
        />
        {tags.trim() !== "" && (
          <View style={styles.tagsPreview}>
            {tags.split(",").filter(t => t.trim()).map((tag, ti) => (
              <View key={ti} style={styles.tagChip}><Text style={styles.tagChipText}>#{tag.trim()}</Text></View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, personalRating === undefined && styles.saveBtnDisabled, saving && { opacity: 0.6 }]}
          onPress={handleSave} disabled={personalRating === undefined || saving} activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{alreadySubmitted ? "Atualizar avaliação" : "Guardar avaliação"}</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: COLORS.error, fontSize: 16 },

  matchHeader: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#eee", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  gameName: { fontSize: 20, fontWeight: "800", color: COLORS.primary, marginBottom: 4 },
  matchDate: { fontSize: 13, color: "#888", marginBottom: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  progressText: { fontSize: 13, color: "#888", fontWeight: "600" },
  playersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  playerChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f5f5f5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  playerDot: { width: 8, height: 8, borderRadius: 4 },
  playerChipText: { fontSize: 12, fontWeight: "600", color: "#555" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#eee", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground },

  entryRow: { flexDirection: "row", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  entryAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center" },
  entryAvatarText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  entryUserName: { fontSize: 14, fontWeight: "700", color: COLORS.onBackground },
  entryNotes: { fontSize: 13, color: "#555", lineHeight: 18, marginTop: 6, marginBottom: 6 },

  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fff8e1", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ffe082" },
  infoText: { flex: 1, fontSize: 13, color: "#856404", lineHeight: 18 },

  fieldLabel: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground, marginBottom: 8 },
  notesInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, fontSize: 14, height: 100, backgroundColor: "#fafafa", color: COLORS.onBackground },
  tagsInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: "#fafafa", color: COLORS.onBackground },
  tagsPreview: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tagChip: { backgroundColor: COLORS.primary + "14", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagChipText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },

  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});