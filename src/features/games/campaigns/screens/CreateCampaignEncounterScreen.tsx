import { MatchOutcome } from "../../matches/types/MatchForm";
import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
/**
 * CreateCampaignEncounterScreen.tsx
 * src/features/games/screens/CreateCampaignEncounterScreen.tsx
 *
 * Rota: /(app)/games/campaigns/encounter/create
 * Params: campaignId, gameId, gameName, memberIds, memberNames (separados por vírgula)
 */
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import matchService from "@/src/features/games/matches/services/matchService";
import campaignService from "@/src/features/games/campaigns/services/campaignService";
import { StarRating } from "@/src/shared/components/StarRating";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { RootState } from "@/src/store/store";
type GameMode = "competitive" | "cooperative" | "solo";
type SoloResult = "player_win" | "game_win" | "none";
export default function CreateCampaignEncounterScreen() {
  const { t } = useTranslation("campaigns");
  const { t: tm } = useTranslation("matches");
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const params = useLocalSearchParams();
  const campaignId  = typeof params.campaignId === "string" ? params.campaignId : "";
  const gameId      = typeof params.gameId === "string" ? params.gameId : "";
  const gameName    = typeof params.gameName === "string" ? decodeURIComponent(params.gameName) : "";
  const memberIds   = typeof params.memberIds === "string" ? params.memberIds.split(",").filter(Boolean) : [];
  const memberNames = typeof params.memberNames === "string" ? params.memberNames.split(",").filter(Boolean) : [];
  // ── Jogadores ────────────────────────────────────────────────────────────
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
    currentUser?.id ? [currentUser.id] : []
  );
  // ── Modo de jogo — OPCIONAL, colapsável ──────────────────────────────────
  const [showMode, setShowMode] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode | null>(null); // null = não definido
  const [soloResult, setSoloResult] = useState<SoloResult>("none");
  const [winnerId, setWinnerId] = useState<string | undefined>();
  const [coopWin, setCoopWin] = useState<boolean | undefined>();
  // ── Detalhes ─────────────────────────────────────────────────────────────
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionOutcome, setSessionOutcome] = useState(""); // resultado livre
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  // ── Minha avaliação ───────────────────────────────────────────────────────
  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const MAX_PHOTOS = 5;
  const [saving, setSaving] = useState(false);
  const [explicitResult, setExplicitResult] = useState<MatchOutcome | undefined>();
  const [resultPlayers, setResultPlayers] = useState<string[]>([]);
  const [sharedVictoryAllowed, setSharedVictoryAllowed] = useState(false);
  const navigationGuard = useUnsavedChanges(!!sessionTitle || !!sessionOutcome || !!duration || !!location || personalRating !== undefined || !!notes || !!tags || pendingPhotos.length > 0 || gameMode !== null || soloResult !== "none" || winnerId !== undefined || coopWin !== undefined || selectedPlayers.join(",") !== (currentUser?.id ?? ""), saving || uploadingPhotos, campaignId ? `/games/campaigns/${campaignId}` : "/(app)/games/campaigns");
  const isSolo = gameMode === "solo";
  const isCoop = gameMode === "cooperative";
  const isComp = gameMode === "competitive";
  const result: MatchOutcome = explicitResult ?? (isSolo ? soloResult === "player_win" ? "Win" : soloResult === "game_win" ? "Loss" : "Undefined" : isCoop ? coopWin === true ? "Win" : coopWin === false ? "Loss" : "Undefined" : winnerId ? "Win" : "Undefined");
  const resultIds = isComp && result !== "Undefined" ? resultPlayers.length ? resultPlayers : winnerId ? [winnerId] : [] : [];
  const getModeLabel = () => {
    if (!gameMode) return t("encounter.mode.undefined");
    if (gameMode === "competitive") return t("encounter.mode.competitive");
    if (gameMode === "cooperative") return t("encounter.mode.cooperative");
    return t("encounter.mode.solo");
  };
  const getModeColor = () => {
    if (!gameMode) return COLORS.inactive;
    if (gameMode === "competitive") return COLORS.primary;
    if (gameMode === "cooperative") return COLORS.success;
    return COLORS.secondary;
  };
  const togglePlayer = (id: string) => {
    if (id === currentUser?.id) return;
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };
  const getMemberName = (id: string) => {
    if (id === currentUser?.id) return t("common.you");
    const idx = memberIds.indexOf(id);
    return memberNames[idx] ?? t("common.member");
  };
  const handlePickPendingPhoto = async () => {
    if (pendingPhotos.length >= MAX_PHOTOS) {
      Alert.alert(t("common.error"), tm("photos.limit", { count: MAX_PHOTOS }));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(tm("photos.permissionTitle"), tm("photos.permission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setPendingPhotos((prev) => [...prev, result.assets[0].uri]);
  };
  const handleRemovePendingPhoto = (uri: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p !== uri));
  };
  const handleSubmit = async () => {
    if (!gameId || !campaignId) return Alert.alert(t("common.error"), t("encounter.validation.missingData"));
    if (selectedPlayers.length === 0) return Alert.alert(t("common.error"), t("encounter.validation.selectPlayer"));
    if (!gameMode) { setShowMode(true); return Alert.alert(t("common.error"), tm("form.changeMode")); }
    if (isSolo ? selectedPlayers.length !== 1 : new Set(selectedPlayers).size < 2) return Alert.alert(t("common.error"), tm(isSolo ? "outcomes.soloOne" : "form.twoPlayers"));
    if (personalRating === undefined || !Number.isFinite(personalRating) || personalRating < 0 || personalRating > 10 || !Number.isInteger(personalRating * 2)) return Alert.alert(t("common.error"), tm("form.ratingRequired"));
    if (resultIds.some(id => !selectedPlayers.includes(id))) return Alert.alert(t("common.error"), tm("outcomes.selectionMembersOnly"));
    if (isComp && result !== "Undefined" && (resultIds.length < (result === "Draw" ? 2 : 1) || result === "Win" && resultIds.length > 1 && !sharedVictoryAllowed)) return Alert.alert(t("common.error"), tm(result === "Draw" ? "outcomes.twoDrawPlayers" : "validation.selectWinner"));
    const dur = duration.trim() ? Number(duration) : undefined;
    if (dur !== undefined && (isNaN(dur) || dur <= 0))
      return Alert.alert(t("common.error"), t("encounter.validation.invalidDuration"));
    setSaving(true);
    try {
      const match = await matchService.registerMatch({
        gameId,
        gameName,
        matchDate: new Date().toISOString(),
        isSoloGame: isSolo,
        players: selectedPlayers.map(id => ({ userId: id, isWinner: false })),
        gameMode: isSolo ? "SOLO" : isCoop ? "COOPERATIVE" : "COMPETITIVE",
        result, resultPlayerIds: resultIds,
        sharedVictoryAllowed: isComp && result === "Win" && sharedVictoryAllowed,
        winnerId: result === "Win" && !isCoop ? isSolo ? currentUser?.id : resultIds.length === 1 ? resultIds[0] : undefined : undefined,
        durationInMinutes: dur,
        location: location.trim() || undefined,
        // resultado geral vai nas notas da partida (scoreSummary)
        scoreSummary: sessionOutcome.trim() || undefined,
        personalRating,
        notes: notes.trim() || undefined,
        tags: tags.trim() || undefined,
        campaignId,
      });
      if (match?.id) {
        await campaignService.addMatch(campaignId, {
          matchId: match.id,
          sessionTitle: sessionTitle.trim() || undefined,
        });
        let photoWarning = "";
        if (pendingPhotos.length > 0) {
          setUploadingPhotos(true);
          let failed = 0;
          for (const uri of pendingPhotos) {
            try {
              await matchService.uploadJournalPhoto(match.id, uri);
            } catch {
              failed++;
            }
          }
          setUploadingPhotos(false);
          if (failed > 0) {
            photoWarning = "\n\n" + tm("photos.partialFailure", { failed, total: pendingPhotos.length });
          }
        }
        navigationGuard.allowExit();
        Alert.alert(
          t("encounter.successTitle"),
          t("encounter.successMessage") + photoWarning,
          [{ text: t("common.ok"), onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          t("encounter.successTitle"),
          t("encounter.successMessage"),
          [{ text: t("common.ok"), onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message ?? t("encounter.errorFallback"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <ScreenLayout title={t("encounter.title")} keyboard mode="cancel" onCancel={navigationGuard.cancel}>
      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.gameChip}>
            <MaterialIcons name="sports-esports" size={14} color={COLORS.primary} />
            <Text style={styles.gameChipText}>{gameName}</Text>
          </View>
        </View>
        {/* ── Título ── */}
        <View style={styles.card}>
          <SectionTitle icon="bookmark" label={t("encounter.sessionTitle")} />
          <TextInput
            style={styles.input}
            value={sessionTitle}
            onChangeText={setSessionTitle}
            placeholder={t("encounter.sessionTitlePlaceholder")}
            placeholderTextColor={COLORS.textMuted}
            maxLength={100} accessibilityLabel={t("encounter.sessionTitle")}
          />
        </View>
        {/* ── Quem jogou ── */}
        <View style={styles.card}>
          <SectionTitle icon="people" label={t("encounter.players.title")} />
          <Text style={styles.hint}>{t("encounter.players.hint")}</Text>
          <View style={styles.playersGrid}>
            {memberIds.map(memberId => {
              const isSelected = selectedPlayers.includes(memberId);
              const isMe = memberId === currentUser?.id;
              return (
                <TouchableOpacity
                  key={memberId}
                  style={[styles.playerChip, isSelected && styles.playerChipSelected]}
                  onPress={() => togglePlayer(memberId)}
                  activeOpacity={isMe ? 1 : 0.8} accessibilityRole="checkbox" accessibilityLabel={t("ui.selectPlayer", { name: getMemberName(memberId) })} accessibilityState={{ checked: isSelected }}
                >
                  <View style={[styles.playerAvatar, isSelected && styles.playerAvatarSelected]}>
                    <Text style={[styles.playerAvatarText, isSelected && { color: "#fff" }]}>
                      {getMemberName(memberId)[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <Text style={[styles.playerChipText, isSelected && { color: COLORS.primary }]}>
                    {getMemberName(memberId)}
                  </Text>
                  {isSelected && <MaterialIcons name="check-circle" size={14} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {/* ── Resultado geral (campo livre) ── */}
        <View style={styles.card}>
          <SectionTitle icon="flag" label={t("encounter.outcome")} />
          <TextInput
            style={[styles.input, { minHeight: 80, paddingTop: 10 }]}
            value={sessionOutcome}
            onChangeText={setSessionOutcome}
            placeholder={t("encounter.outcomePlaceholder")}
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500} accessibilityLabel={t("encounter.outcome")}
          />
        </View>
        {/* ── Modo de jogo — COLAPSÁVEL E OPCIONAL ── */}
        <View style={styles.card}>
          {/* Header colapsável */}
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setShowMode(v => !v)}
            activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t("encounter.mode.title")} accessibilityState={{ expanded: showMode }}
          >
            <View style={styles.collapsibleLeft}>
              <MaterialIcons name="gamepad" size={16} color={COLORS.primary} />
              <Text style={styles.sectionTitleText}>{t("encounter.mode.title")}</Text>
              <View style={[styles.modePill, { backgroundColor: getModeColor() + "18" }]}>
                <Text style={[styles.modePillText, { color: getModeColor() }]}>
                  {getModeLabel()}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name={showMode ? "expand-less" : "expand-more"}
              size={22} color={COLORS.textMuted}
            />
          </TouchableOpacity>
          {showMode && (
            <View style={{ marginTop: 14 }}>
              {/* Botões de modo */}
              <View style={styles.modeRow}>
                {([
                  { key: "competitive", label: t("encounter.mode.competitive"), icon: "emoji-events", color: COLORS.primary },
                  { key: "cooperative", label: t("encounter.mode.cooperative"), icon: "favorite",     color: COLORS.success },
                  { key: "solo",        label: t("encounter.mode.solo"),        icon: "person",       color: COLORS.secondary },
                ] as { key: GameMode; label: string; icon: string; color: string }[]).map(m => (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.modeBtn,
                      gameMode === m.key && { borderColor: m.color, backgroundColor: m.color + "12" },
                    ]}
                    onPress={() => {
                      // toggle — carrega 2x para limpar
                      setGameMode(prev => prev === m.key ? null : m.key);
                      setWinnerId(undefined);
                      setCoopWin(undefined);
                      setSoloResult("none"); setExplicitResult(undefined); setResultPlayers([]); setSharedVictoryAllowed(false);
                    }}
                    activeOpacity={0.8} accessibilityRole="radio" accessibilityLabel={m.label} accessibilityState={{ selected: gameMode === m.key }}
                  >
                    <MaterialIcons name={m.icon as any} size={22} color={gameMode === m.key ? m.color : COLORS.textMuted} />
                    <Text style={[styles.modeBtnText, gameMode === m.key && { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {gameMode && <View style={{ gap: 8, marginTop: 12 }}>
                <Text style={styles.subLabel}>{tm("steps.result")}</Text>
                <View style={styles.resultRow}>
                  {(isComp ? ["Win", "Draw", "Undefined"] : ["Win", "Loss", "Draw", "Undefined"]).map(value => <TouchableOpacity key={value}
                    style={[styles.resultBtn, result === value && styles.winnerOptionSelected]} accessibilityRole="radio" accessibilityState={{ selected: result === value }}
                    onPress={() => { setExplicitResult(value as MatchOutcome); setResultPlayers([]); setWinnerId(undefined); }}>
                    <Text style={styles.resultLabel}>{tm(isCoop ? `outcomes.team${value}` : `outcomes.${value}`)}</Text>
                  </TouchableOpacity>)}
                </View>
                {isComp && result === "Win" && <TouchableOpacity style={styles.winnerOption} accessibilityRole="checkbox" accessibilityState={{ checked: sharedVictoryAllowed }}
                  onPress={() => { setSharedVictoryAllowed(v => !v); setResultPlayers([]); setWinnerId(undefined); }}>
                  <Text>{sharedVictoryAllowed ? "☑ " : "☐ "}{tm("outcomes.sharedAllowed")}</Text>
                </TouchableOpacity>}
                {isComp && result !== "Undefined" && selectedPlayers.map(pid => <TouchableOpacity key={pid}
                  accessibilityRole={result === "Draw" || sharedVictoryAllowed ? "checkbox" : "radio"}
                  accessibilityLabel={tm(result === "Draw" ? "outcomes.drawFor" : "selector.winnerFor", { name: getMemberName(pid) })}
                  accessibilityState={{ selected: resultIds.includes(pid) }} style={[styles.winnerOption, resultIds.includes(pid) && styles.winnerOptionSelected]}
                  onPress={() => { setWinnerId(undefined); setResultPlayers(prev => result === "Draw" || sharedVictoryAllowed ? prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid] : [pid]); }}>
                  <Text>{resultIds.includes(pid) ? "☑ " : "☐ "}{getMemberName(pid)}</Text>
                </TouchableOpacity>)}
                <Text style={styles.hint}>{tm(result === "Draw" && isComp ? "outcomes.drawHelp" : "outcomes.explicitHelp")}</Text>
              </View>}
            </View>
          )}
        </View>
        {/* ── Detalhes opcionais ── */}
        <View style={styles.card}>
          <SectionTitle icon="info" label={t("encounter.details.title")} />
          <DetailField label={t("encounter.details.duration")} placeholder={t("encounter.details.durationPlaceholder")} value={duration} onChangeText={setDuration} keyboardType="numeric" />
          <DetailField label={t("encounter.details.location")} placeholder={t("encounter.details.locationPlaceholder")} value={location} onChangeText={setLocation} />
        </View>
        {/* ── A minha avaliação ── */}
        <View style={styles.card}>
          <SectionTitle icon="star" label={t("encounter.rating.title")} />
          <Text style={styles.subLabel}>{t("encounter.rating.value")}</Text>
          <StarRating appearance="refresh" value={personalRating} onChange={setPersonalRating} size={30} />
          <View style={{ marginTop: 14 }}>
            <DetailField
              label={t("encounter.rating.notes")}
              placeholder={t("encounter.rating.notesPlaceholder")}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
            <DetailField
              label={t("encounter.rating.tags")}
              placeholder={t("encounter.rating.tagsPlaceholder")}
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
          <Text style={[styles.subLabel, { marginTop: 16 }]}>
            {tm("photos.label")} {pendingPhotos.length > 0 ? `— ${pendingPhotos.length}/${MAX_PHOTOS}` : ""}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pendingPhotos.map((uri, pi) => (
              <View key={pi} style={styles.photoThumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => handleRemovePendingPhoto(uri)} accessibilityRole="button" accessibilityLabel={tm("photos.remove")}>
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {pendingPhotos.length < MAX_PHOTOS && (
              <TouchableOpacity style={styles.photoAddBtn} onPress={handlePickPendingPhoto} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={tm("photos.add")}>
                <MaterialIcons name="add-a-photo" size={20} color={COLORS.primary} />
                <Text style={styles.photoAddText}>{tm("photos.add")}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text style={styles.hint}>{tm("photos.hint")}</Text>
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>
      <View style={styles.stickyBar}>
        <PrimaryButton title={uploadingPhotos ? tm("photos.uploading") : t("encounter.submit")} onPress={handleSubmit} loading={saving || uploadingPhotos} />
      </View>
    </ScreenLayout>
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
        style={[styles.input, multiline && { minHeight: (numberOfLines ?? 3) * 26, paddingTop: 10 }]}
        value={value} onChangeText={onChangeText}
        accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType} multiline={multiline}
        numberOfLines={numberOfLines} textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 20 },
  header: { marginBottom: 20 },
  gameChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primary + "10", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start",
  },
  gameChipText: { ...UI_STYLES.body, color: COLORS.primary, flexShrink: 1 },
  card: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },
  // Colapsável
  collapsibleHeader: { ...UI_STYLES.control, flexDirection: "row", alignItems: "center", gap: 8 },
  collapsibleLeft: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, flex: 1 },
  modePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  modePillText: { ...UI_STYLES.caption, fontWeight: "700" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitleText: { ...UI_STYLES.section, flexShrink: 1 },
  hint: { ...UI_STYLES.caption, color: COLORS.textMuted, marginBottom: 12 },
  input: { ...UI_STYLES.field },
  playersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  playerChip: { ...UI_STYLES.control, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  playerChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  playerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#e8e8e8", alignItems: "center", justifyContent: "center",
  },
  playerAvatarSelected: { backgroundColor: COLORS.primary },
  playerAvatarText: { ...UI_STYLES.caption, fontWeight: "800", color: COLORS.textMuted },
  playerChipText: { ...UI_STYLES.body, color: COLORS.onBackground, flexShrink: 1 },
  modeRow: { gap: 8 },
  modeBtn: { ...UI_STYLES.control, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  modeBtnText: { ...UI_STYLES.body, color: COLORS.textMuted, fontWeight: "700" },
  subLabel: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", marginBottom: 8 },
  resultRow: { gap: 8 },
  resultBtn: { ...UI_STYLES.control, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  resultEmoji: { fontSize: 20 },
  resultLabel: { ...UI_STYLES.body, color: COLORS.textMuted, flexShrink: 1 },
  winnerOption: { ...UI_STYLES.card, minHeight: 52, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  winnerOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  winnerOptionText: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.onBackground },
  field: { marginBottom: 12 },
  fieldLabel: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", marginBottom: 8 },
  tagsPreview: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: COLORS.primary + "14", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { ...UI_STYLES.caption, color: COLORS.primary, fontWeight: "600" },
  photoThumb: { width: 96, height: 96, borderRadius: 12, backgroundColor: COLORS.border },
  photoThumbWrap: { position: "relative", marginRight: 12 },
  photoRemoveBtn: { ...UI_STYLES.iconButton, position: "absolute", top: 0, right: 0, backgroundColor: "rgba(0,0,0,0.75)" },
  photoAddBtn: { width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center" },
  photoAddText: { ...UI_STYLES.caption, color: COLORS.primary, fontWeight: "700", marginTop: 4 },
  stickyBar: { padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
});
