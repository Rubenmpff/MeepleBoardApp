/**
 * CreateCampaignScreen.tsx
 * Rota: /(app)/games/campaigns/create?gameId=...&gameName=...
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import campaignService from "@/src/features/games/services/campaignService";
import { GameSelector } from "@/src/features/games/components/GameSelector";
import { Game } from "@/src/features/games/types/Game";
import { COLORS } from "@/src/constants/colors";

export default function CreateCampaignScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const paramGameId = typeof params.gameId === "string" ? params.gameId : "";
  const paramGameName = typeof params.gameName === "string"
    ? decodeURIComponent(params.gameName)
    : "";

  const [selectedGame, setSelectedGame] = useState<Game | null>(
    paramGameId ? ({ id: paramGameId, name: paramGameName } as Game) : null
  );

  const gameId = selectedGame?.id ?? "";
  const gameName = selectedGame?.name ?? "";

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  /**
   * ✅ Reset total ao SAIR deste ecrã (voltar atrás ou navegar para outro sítio).
   * Assim, se abrires "Criar Campanha" outra vez, começa sempre limpo —
   * mesmo o jogo pré-selecionado é recalculado de novo a partir da rota,
   * por isso não precisa de tratamento especial aqui.
   */
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

  const nameError =
    name.trim().length > 0 && name.trim().length < 2
      ? "O nome deve ter pelo menos 2 caracteres."
      : null;

  const canSave = name.trim().length >= 2 && !!gameId && !saving;

  const handleSave = async () => {
    if (!gameId) {
      Alert.alert("Jogo em falta", "Escolhe primeiro o jogo desta campanha.");
      return;
    }

    if (!canSave) return;

    setSaving(true);
    try {
      const created = await campaignService.create({
        name: name.trim(),
        gameId,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        "Campanha criada!",
        "Podes convidar membros e associar partidas.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace({
                pathname: "/(app)/games/campaigns/[id]" as any,
                params: { id: created.id },
              }),
          },
        ]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Erro ao criar campanha.";
      Alert.alert("Erro", String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nova Campanha</Text>

          {selectedGame ? (
            <TouchableOpacity
              style={styles.gameChip}
              onPress={() => setSelectedGame(null)}
              disabled={!!paramGameId}
            >
              <MaterialIcons name="sports-esports" size={14} color={COLORS.primary} />
              <Text style={styles.gameChipText}>{gameName}</Text>
              {!paramGameId && (
                <MaterialIcons name="close" size={14} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {!selectedGame && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MaterialIcons name="sports-esports" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitleText}>Escolhe o jogo *</Text>
            </View>
            <GameSelector onSelect={(game) => setSelectedGame(game)} />
          </View>
        )}

        {selectedGame && (
          <>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <MaterialIcons name="flag" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitleText}>Detalhes da campanha</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nome *</Text>
                <TextInput
                  style={nameError ? [styles.input, styles.inputError] : styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Gloomhaven — Grupo do Ruben"
                  placeholderTextColor="#bbb"
                  maxLength={100}
                />
                {nameError ? (
                  <Text style={styles.fieldError}>{nameError}</Text>
                ) : null}
                <Text style={styles.fieldHint}>{name.trim().length}/100</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notas iniciais (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Estado do mundo, personagens, objetivos..."
                  placeholderTextColor="#bbb"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={styles.fieldHint}>{notes.trim().length}/1000</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Depois de criar a campanha podes convidar membros, associar partidas e
                cada jogador pode escrever as suas notas e avaliações.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedGame && (
        <View style={styles.stickyBar}>
          <TouchableOpacity
            style={canSave ? styles.saveBtn : [styles.saveBtn, styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Criar Campanha</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 20 },

  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.primary, marginBottom: 8 },
  gameChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  gameChipText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitleText: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground },

  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.onBackground,
    marginBottom: 6,
  },
  fieldError: { fontSize: 12, color: COLORS.error, marginTop: 4, fontWeight: "600" },
  fieldHint: { fontSize: 11, color: "#bbb", marginTop: 4, textAlign: "right" },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    color: COLORS.onBackground,
  },
  inputError: { borderColor: COLORS.error },
  inputMultiline: { height: 110, paddingTop: 10 },

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
  infoText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 18 },

  stickyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: "#eee",
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
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});