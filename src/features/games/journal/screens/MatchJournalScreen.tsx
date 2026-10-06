import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenState from "@/src/components/ui/ScreenState";
/**
 * MatchJournalScreen.tsx
 * src/features/games/screens/MatchJournalScreen.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView, Platform, View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity, Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import matchService from "@/src/features/games/matches/services/matchService";
import { MatchDto } from "@/src/features/games/matches/types/MatchForm";
import { JournalEntry } from "@/src/features/games/campaigns/types/Campaign";
import { StarRating } from "@/src/shared/components/StarRating";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { RootState } from "@/src/store/store";

export default function MatchJournalScreen() {
  const { t, i18n } = useTranslation("matches");
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [match, setMatch] = useState<MatchDto | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const myEntry = entries.find(e => e.userId === currentUser?.id);
  const alreadySubmitted = !!myEntry?.personalRating;
  const isClosed = match?.journalStatus === "Closed";
  const myPhotos = myEntry?.photoUrls ?? [];
  const MAX_PHOTOS = 5;

  const [loadError, setLoadError] = useState(false);
  const savedDraft = useRef(JSON.stringify([undefined, "", ""]));
  const navigationGuard = useUnsavedChanges(!loading && JSON.stringify([personalRating, notes, tags]) !== savedDraft.current, saving || uploadingPhoto, "/games/pending-journal");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoadError(false);
      setLoading(true);
      const [matchData, entriesData] = await Promise.all([
        matchService.getById(id),
        matchService.getJournalEntries(id),
      ]);
      setMatch(matchData);
      setEntries(entriesData);
      const mine = entriesData.find(e => e.userId === currentUser?.id);
      savedDraft.current = JSON.stringify([mine?.personalRating ?? undefined, mine?.notes ?? "", mine?.tags ?? ""]);
      if (mine) {
        setPersonalRating(mine.personalRating ?? undefined);
        setNotes(mine.notes ?? "");
        setTags(mine.tags ?? "");
      }
    } catch {
      setLoadError(true);
      Alert.alert(t("ui.error"), t("ui.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!id) return;
    if (personalRating === undefined) {
      Alert.alert(t("journal.requiredTitle"), t("journal.required"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        personalRating: Math.round(personalRating),
        notes: notes.trim() || null,
        tags: tags.trim() || null,
      };
      console.log("📝 JOURNAL UPSERT PAYLOAD =>", id, JSON.stringify(payload));
      await matchService.upsertJournalEntry(id, payload);
      savedDraft.current = JSON.stringify([personalRating, notes, tags]);
      Alert.alert(t("journal.savedTitle"), t("journal.saved"),
        [{ text: "OK", onPress: load }]);
    } catch (err: any) {
      Alert.alert(t("ui.error"), err?.message ?? t("journal.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handlePickPhoto = async () => {
    if (!id) return;
    if (myPhotos.length >= MAX_PHOTOS) {
      Alert.alert(t("photos.limitTitle"), t("photos.limit", { count: MAX_PHOTOS }));
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("photos.permissionTitle"), t("photos.permission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingPhoto(true);
    try {
      await matchService.uploadJournalPhoto(id, result.assets[0].uri);
      await load();
    } catch (err: any) {
      Alert.alert(t("ui.error"), err?.message ?? t("photos.uploadError"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (url: string) => {
    if (!id) return;
    Alert.alert(t("photos.removeTitle"), t("photos.removeConfirm"), [
      { text: t("journal.cancel"), style: "cancel" },
      {
        text: t("journal.remove"), style: "destructive",
        onPress: async () => {
          try {
            await matchService.removeJournalPhoto(id, url);
            await load();
          } catch (err: any) {
            Alert.alert(t("ui.error"), err?.message ?? t("photos.removeError"));
          }
        },
      },
    ]);
  };

  if (loading) return <SafeAreaView style={styles.screen}><ScreenHeader mode="cancel" title={t("ui.journalTitle")} appearance="refresh" onLeftPress={navigationGuard.cancel} /><ScreenState loading message={t("ui.loading")} /></SafeAreaView>;
  if (!match || loadError) return <SafeAreaView style={styles.screen}><ScreenHeader mode="cancel" title={t("ui.journalTitle")} appearance="refresh" onLeftPress={navigationGuard.cancel} /><ScreenState error={loadError} message={t(loadError ? "ui.loadError" : "ui.notFound")} onRetry={load} retryLabel={t("ui.retry")} /></SafeAreaView>;

  const submittedCount = entries.filter(e => e.personalRating != null).length;
  const totalPlayers = match.players?.length ?? 0;

  return (
    <SafeAreaView style={styles.screen}>
    <ScreenHeader mode="cancel" title={t("ui.journalTitle")} appearance="refresh" onLeftPress={navigationGuard.cancel} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView keyboardDismissMode="on-drag" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* ── Header ── */}
      <View style={styles.matchHeader}>
        <Text style={styles.gameName}>{match.gameName}</Text>
        <Text style={styles.matchDate}>
          {new Date(match.matchDate).toLocaleDateString(i18n.language === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: isClosed ? COLORS.primary + "20" : COLORS.success + "20" }]}>
            <Text style={[styles.statusText, { color: isClosed ? COLORS.primary : COLORS.success }]}>
              {isClosed ? t("journal.closed") : t("journal.open")}
            </Text>
          </View>
          <Text style={styles.progressText}>{t("journal.progress", { submitted: submittedCount, total: totalPlayers })}</Text>
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
            <Text style={styles.cardTitle}>{t("journal.others")}</Text>
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
                  <StarRating appearance="refresh" value={entry.personalRating} readonly size={16} showLabel={false} />
                )}
                {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
                {entry.photoUrls && entry.photoUrls.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                    {entry.photoUrls.map((url, pi) => (
                      <Image key={pi} source={{ uri: url }} style={styles.photoThumb} />
                    ))}
                  </ScrollView>
                )}
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
          <Text style={styles.infoText}>{t("journal.closedHint")}</Text>
        </View>
      )}

      {/* ── Formulário ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons name="star" size={16} color={COLORS.primary} />
          <Text style={styles.cardTitle}>{alreadySubmitted ? t("journal.yourRating") : t("journal.leaveRating")}</Text>
        </View>

        <Text style={styles.fieldLabel}>{t("journal.rating")}</Text>
        <StarRating appearance="refresh" value={personalRating} onChange={setPersonalRating} size={32} />

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t("journal.notes")}</Text>
        <TextInput
          style={styles.notesInput}
          value={notes} onChangeText={setNotes}
          placeholder={t("journal.notesPlaceholder")} accessibilityLabel={t("journal.notes")}
          placeholderTextColor={COLORS.textMuted} multiline numberOfLines={4}
          textAlignVertical="top" maxLength={2000}
        />

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{t("journal.tags")}</Text>
        <TextInput
          style={styles.tagsInput}
          value={tags} onChangeText={setTags}
          placeholder={t("journal.tagsPlaceholder")} accessibilityLabel={t("journal.tags")}
          placeholderTextColor={COLORS.textMuted} maxLength={500}
        />
        {tags.trim() !== "" && (
          <View style={styles.tagsPreview}>
            {tags.split(",").filter(t => t.trim()).map((tag, ti) => (
              <View key={ti} style={styles.tagChip}><Text style={styles.tagChipText}>#{tag.trim()}</Text></View>
            ))}
          </View>
        )}

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
          {t("photos.label")} {myPhotos.length > 0 ? `— ${myPhotos.length}/${MAX_PHOTOS}` : ""}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {myPhotos.map((url, pi) => (
            <View key={pi} style={styles.photoThumbWrap}>
              <Image source={{ uri: url }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.photoRemoveBtn} accessibilityRole="button" accessibilityLabel={t("photos.remove")} onPress={() => handleRemovePhoto(url)}>
                <MaterialIcons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {myPhotos.length < MAX_PHOTOS && (
            <TouchableOpacity
              style={styles.photoAddBtn}
              accessibilityRole="button" accessibilityLabel={t("photos.add")}
              accessibilityState={{ disabled: uploadingPhoto, busy: uploadingPhoto }}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
              activeOpacity={0.8}
            >
              {uploadingPhoto
                ? <ActivityIndicator color={COLORS.primary} size="small" />
                : <>
                    <MaterialIcons name="add-a-photo" size={20} color={COLORS.primary} />
                    <Text style={styles.photoAddText}>{t("photos.add")}</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={{ marginTop: 24 }}>
          <PrimaryButton title={t(alreadySubmitted ? "journal.update" : "journal.save")}
            onPress={handleSave} disabled={personalRating === undefined} loading={saving} />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },

  matchHeader: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },
  gameName: { ...UI_STYLES.title, marginBottom: 4 },
  matchDate: { ...UI_STYLES.caption, color: COLORS.textMuted, marginBottom: 12 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  progressText: { ...UI_STYLES.caption, color: COLORS.textMuted },
  playersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  playerChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f5f5f5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  playerDot: { width: 8, height: 8, borderRadius: 4 },
  playerChipText: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },

  card: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { ...UI_STYLES.section, flexShrink: 1 },

  entryRow: { flexDirection: "row", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  entryAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center" },
  entryAvatarText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  entryUserName: { ...UI_STYLES.body, fontWeight: "700" },
  entryNotes: { ...UI_STYLES.body, marginVertical: 8 },

  photoScroll: { marginTop: 8 },
  photoThumb: { width: 96, height: 96, borderRadius: 12, marginRight: 12, backgroundColor: COLORS.border },
  photoThumbWrap: { position: "relative", marginRight: 8 },
  photoRemoveBtn: { ...UI_STYLES.iconButton, position: "absolute", top: 0, right: 12, backgroundColor: "rgba(0,0,0,0.75)" },
  photoAddBtn: { width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primarySoft },
  photoAddText: { ...UI_STYLES.caption, color: COLORS.primary, fontWeight: "700", marginTop: 4 },

  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fff8e1", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ffe082" },
  infoText: { ...UI_STYLES.body, flex: 1, color: "#856404" },

  fieldLabel: { ...UI_STYLES.body, fontWeight: "700", marginBottom: 8 },
  notesInput: { ...UI_STYLES.field, minHeight: 120, textAlignVertical: "top" },
  tagsInput: { ...UI_STYLES.field },
  tagsPreview: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tagChip: { backgroundColor: COLORS.primary + "14", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagChipText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },

});
