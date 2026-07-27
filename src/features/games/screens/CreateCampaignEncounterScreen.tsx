/**
 * CreateCampaignEncounterScreen.tsx
 * src/features/games/screens/CreateCampaignEncounterScreen.tsx
 *
 * Ecrã específico para registar um encontro dentro de uma campanha.
 * Mais simples que o RegisterMatchForm — o jogo já está definido
 * e os jogadores são membros da campanha.
 *
 * Rota: /(app)/games/campaigns/encounter/create
 * Params: campaignId, gameId, gameName, memberIds (separados por vírgula)
 */

import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import matchService from "@/src/features/games/services/matchService";
import campaignService from "@/src/features/games/services/campaignService";
import { StarRating } from "@/src/features/games/components/StarRating";
import { COLORS } from "@/src/constants/colors";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";

type GameMode = "competitive" | "cooperative" | "solo";
type SoloResult = "player_win" | "game_win" | "none";

export default function CreateCampaignEncounterScreen() {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const params = useLocalSearchParams();

  const campaignId = typeof params.campaignId === "string" ? params.campaignId : "";
  const gameId     = typeof params.gameId === "string" ? params.gameId : "";
  const gameName   = typeof params.gameName === "string" ? decodeURIComponent(params.gameName) : "";
  const memberIds   = typeof params.memberIds === "string" ? params.memberIds.split(",").filter(Boolean) : [];
  const memberNames = typeof params.memberNames === "string" ? params.memberNames.split(",").filter(Boolean) : [];

  // ── Jogadores que jogaram neste encontro ─────────────────────────────────
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
    currentUser?.id ? [currentUser.id] : []
  );

  // ── Modo e resultado ──────────────────────────────────────────────────────
  const [gameMode, setGameMode] = useState<GameMode>("competitive");
  const [soloResult, setSoloResult] = useState<SoloResult>("none");
  const [winnerId, setWinnerId] = useState<string | undefined>();
  const [coopWin, setCoopWin] = useState<boolean | undefined>();

  // ── Detalhes ─────────────────────────────────────────────────────────────
  const [sessionTitle, setSessionTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [scoreSummary, setScoreSummary] = useState("");

  // ── Minha avaliação ───────────────────────────────────────────────────────
  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  const [saving, setSaving] = useState(false);

  const isSolo  = gameMode === "solo";
  const isCoop  = gameMode === "cooperative";

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!gameId || !campaignId) return Alert.alert("Erro", "Dados em falta.");
    if (selectedPlayers.length === 0) return Alert.alert("Erro", "Seleciona pelo menos um jogador.");

    if (!isSolo && !isCoop && !winnerId)
      return Alert.alert("Erro", "Seleciona o vencedor.");

    const dur = duration.trim() ? Number(duration) : undefined;
    if (dur !== undefined && (isNaN(dur) || dur <= 0))
      return Alert.alert("Erro", "Duração inválida.");

    setSaving(true);
    try {
      // 1. Regista a partida
      const match = await matchService.registerMatch({
        gameId,
        gameName,
        matchDate: new Date().toISOString(),
        isSoloGame: isSolo,
        players: selectedPlayers.map(id => ({ userId: id, isWinner: false })),
        winnerId: isSolo
          ? (soloResult === "player_win" ? currentUser?.id : undefined)
          : isCoop
          ? undefined
          : winnerId,
        durationInMinutes: dur,
        location: location.trim() || undefined,
        scoreSummary: scoreSummary.trim() || undefined,
        personalRating,
        notes: notes.trim() || undefined,
        tags: tags.trim() || undefined,
        campaignId,
      });

      // 2. Associa à campanha com título opcional
      if (match?.id) {
        await campaignService.addMatch(campaignId, {
          matchId: match.id,
          sessionTitle: sessionTitle.trim() || undefined,
        });
      }

      Alert.alert(
        "✅ Encontro registado!",
        "Os outros membros serão notificados para avaliarem.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível registar o encontro.");
    } finally {
      setSaving(false);
    }
  };

  const togglePlayer = (id: string) => {
    if (id === currentUser?.id) return; // criador não pode remover-se
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Encontro</Text>
          <View style={styles.gameChip}>
            <MaterialIcons name="sports-esports" size={14} color={COLORS.primary} />
            <Text style={styles.gameChipText}>{gameName}</Text>
          </View>
        </View>

        {/* ── Título do encontro (opcional) ── */}
        <View style={styles.card}>
          <SectionTitle icon="bookmark" label="Título (opcional)" />
          <TextInput
            style={styles.input}
            value={sessionTitle}
            onChangeText={setSessionTitle}
            placeholder="Ex: Cenário 3 — A Cripta, Mês de Janeiro..."
            placeholderTextColor="#bbb"
            maxLength={100}
          />
        </View>

        {/* ── Quem jogou hoje ── */}
        <View style={styles.card}>
          <SectionTitle icon="people" label="Quem jogou hoje?" />
          <Text style={styles.hint}>Seleciona os membros que participaram neste encontro.</Text>
          <View style={styles.playersGrid}>
            {memberIds.map(memberId => {
              const isSelected = selectedPlayers.includes(memberId);
              const isMe = memberId === currentUser?.id;
              return (
                <TouchableOpacity
                  key={memberId}
                  style={[styles.playerChip, isSelected && styles.playerChipSelected]}
                  onPress={() => togglePlayer(memberId)}
                  activeOpacity={isMe ? 1 : 0.8}
                >
                  <View style={[styles.playerAvatar, isSelected && styles.playerAvatarSelected]}>
                    <Text style={[styles.playerAvatarText, isSelected && { color: "#fff" }]}>
                      {memberId[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <Text style={[styles.playerChipText, isSelected && { color: COLORS.primary }]}>
                    {isMe ? "Tu" : (memberNames[memberIds.indexOf(memberId)] ?? "Membro")}
                  </Text>
                  {isSelected && <MaterialIcons name="check-circle" size={14} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Modo de jogo ── */}
        <View style={styles.card}>
          <SectionTitle icon="gamepad" label="Modo de jogo" />
          <View style={styles.modeRow}>
            {([
              { key: "competitive", label: "Competitivo", icon: "emoji-events", color: COLORS.primary },
              { key: "cooperative", label: "Cooperativo",  icon: "favorite",     color: COLORS.success },
              { key: "solo",        label: "Solo",         icon: "person",       color: COLORS.secondary },
            ] as { key: GameMode; label: string; icon: string; color: string }[]).map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.modeBtn, gameMode === m.key && { borderColor: m.color, backgroundColor: m.color + "12" }]}
                onPress={() => setGameMode(m.key)}
                activeOpacity={0.8}
              >
                <MaterialIcons name={m.icon as any} size={22} color={gameMode === m.key ? m.color : "#bbb"} />
                <Text style={[styles.modeBtnText, gameMode === m.key && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Resultado */}
          {isSolo && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subLabel}>Resultado</Text>
              <View style={styles.resultRow}>
                {([
                  { key: "player_win", label: "Ganhei",        emoji: "🏆", color: COLORS.success },
                  { key: "game_win",   label: "O jogo ganhou", emoji: "💀", color: COLORS.error },
                  { key: "none",       label: "Sem resultado",  emoji: "—",  color: "#888" },
                ] as { key: SoloResult; label: string; emoji: string; color: string }[]).map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.resultBtn, soloResult === r.key && { borderColor: r.color, backgroundColor: r.color + "12" }]}
                    onPress={() => setSoloResult(r.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resultEmoji}>{r.emoji}</Text>
                    <Text style={[styles.resultLabel, soloResult === r.key && { color: r.color, fontWeight: "700" }]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {isCoop && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subLabel}>Resultado da equipa</Text>
              <View style={styles.resultRow}>
                <TouchableOpacity
                  style={[styles.resultBtn, coopWin === true && { borderColor: COLORS.success, backgroundColor: COLORS.success + "12" }]}
                  onPress={() => setCoopWin(true)} activeOpacity={0.8}
                >
                  <Text style={styles.resultEmoji}>🏆</Text>
                  <Text style={[styles.resultLabel, coopWin === true && { color: COLORS.success, fontWeight: "700" }]}>Ganhámos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resultBtn, coopWin === false && { borderColor: COLORS.error, backgroundColor: COLORS.error + "12" }]}
                  onPress={() => setCoopWin(false)} activeOpacity={0.8}
                >
                  <Text style={styles.resultEmoji}>💀</Text>
                  <Text style={[styles.resultLabel, coopWin === false && { color: COLORS.error, fontWeight: "700" }]}>Perdemos</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!isSolo && !isCoop && selectedPlayers.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subLabel}>Vencedor</Text>
              {selectedPlayers.map(pid => (
                <TouchableOpacity
                  key={pid}
                  style={[styles.winnerOption, winnerId === pid && styles.winnerOptionSelected]}
                  onPress={() => setWinnerId(pid)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={winnerId === pid ? "radio-button-checked" : "radio-button-unchecked"}
                    size={20} color={winnerId === pid ? COLORS.primary : "#bbb"}
                  />
                  <Text style={[styles.winnerOptionText, winnerId === pid && { color: COLORS.primary }]}>
                    {pid === currentUser?.id ? "Tu" : (memberNames[memberIds.indexOf(pid)] ?? "Membro")}
                  </Text>
                  {winnerId === pid && <Text>🏆</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Detalhes ── */}
        <View style={styles.card}>
          <SectionTitle icon="info" label="Detalhes opcionais" />
          <DetailField label="⏱ Duração (minutos)" placeholder="Ex: 120" value={duration} onChangeText={setDuration} keyboardType="numeric" />
          <DetailField label="📍 Local" placeholder="Ex: Casa do João" value={location} onChangeText={setLocation} />
          <DetailField label="📝 Resumo de pontuação" placeholder="Ex: Ruben 45, Miguel 38..." value={scoreSummary} onChangeText={setScoreSummary} />
        </View>

        {/* ── A minha avaliação ── */}
        <View style={styles.card}>
          <SectionTitle icon="star" label="A tua avaliação deste encontro" />

          <Text style={styles.subLabel}>Rating (0–10)</Text>
          <StarRating
            value={personalRating}
            onChange={setPersonalRating}
            size={30}
          />

          <DetailField
            label="📖 Notas"
            placeholder="Momentos épicos, o que correu bem ou mal..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          <DetailField
            label="🏷️ Tags (separadas por vírgula)"
            placeholder="épico, reviravolta, difícil..."
            value={tags}
            onChangeText={setTags}
          />

          {tags.trim() !== "" && (
            <View style={styles.tagsPreview}>
              {tags.split(",").filter(t => t.trim()).map((tag, i) => (
                <View key={i} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag.trim()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky bar */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Registar Encontro</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <MaterialIcons name={icon as any} size={16} color={COLORS.primary} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function DetailField({ label, placeholder, value, onChangeText, keyboardType, multiline, numberOfLines }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean; numberOfLines?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: (numberOfLines ?? 3) * 26, paddingTop: 10 }]}
        value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor="#bbb"
        keyboardType={keyboardType} multiline={multiline}
        numberOfLines={numberOfLines} textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 20 },

  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.onBackground, marginBottom: 8 },
  gameChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primary + "10", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start",
  },
  gameChipText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#f0f0f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitleText: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground },

  hint: { fontSize: 12, color: COLORS.inactive, marginBottom: 12 },

  input: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 12,
    padding: 12, fontSize: 14, backgroundColor: "#fafafa", color: COLORS.onBackground,
  },

  playersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  playerChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e8e8e8", backgroundColor: "#fafafa",
  },
  playerChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  playerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#e8e8e8", alignItems: "center", justifyContent: "center",
  },
  playerAvatarSelected: { backgroundColor: COLORS.primary },
  playerAvatarText: { fontSize: 12, fontWeight: "800", color: "#888" },
  playerChipText: { fontSize: 13, fontWeight: "600", color: COLORS.onBackground },

  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e8e8e8", backgroundColor: "#fafafa", gap: 6,
  },
  modeBtnText: { fontSize: 11, fontWeight: "700", color: "#bbb" },

  subLabel: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground, marginBottom: 8 },
  resultRow: { flexDirection: "row", gap: 8 },
  resultBtn: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e8e8e8", backgroundColor: "#fafafa", gap: 4,
  },
  resultEmoji: { fontSize: 20 },
  resultLabel: { fontSize: 11, fontWeight: "600", color: "#888", textAlign: "center" },

  winnerOption: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e8e8e8",
    marginBottom: 8, backgroundColor: "#fafafa",
  },
  winnerOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  winnerOptionText: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.onBackground },

  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground, marginBottom: 6 },

  tagsPreview: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: COLORS.primary + "14", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  stickyBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});