import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
/**
 * CreateSessionScreen.tsx
 *
 * Campos:
 *   - Nome (obrigatório, mín. 3 chars)
 *   - Local (opcional)
 *   - Data e hora da sessão (DatePicker nativo)
 *   - Data limite de resposta (opcional, tem de ser antes da sessão)
 *   - Convidar amigos (opcional)
 */
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { useGameSessions } from "../hooks/useGameSessions";
import { useFriends } from "@/src/features/friends/hooks/useFriends";
/* ── Helpers ── */
function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}
function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
type PickerTarget = "session_date" | "session_time" | "deadline_date" | "deadline_time";
/* ── Component ── */
export default function CreateSessionScreen() {
  const { t, i18n } = useTranslation("matches");
  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";
  const router = useRouter();
  const { createSession, error: createError } = useGameSessions();
  const { friends, loading: friendsLoading } = useFriends();
  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // Default session date: daqui a 1 hora
  const defaultSessionDate = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() >= 30 ? 30 : 0, 0, 0);
    return d;
  }, []);
  // Default deadline: 24h antes da sessão
  const defaultDeadline = useMemo(() => {
    const d = new Date(defaultSessionDate.getTime() - 24 * 60 * 60 * 1000);
    return d;
  }, [defaultSessionDate]);
  const [sessionDate, setSessionDate] = useState<Date>(defaultSessionDate);
  const [deadlineDate, setDeadlineDate] = useState<Date>(defaultDeadline);
  const [useDeadline, setUseDeadline] = useState(false);
  const navigationGuard = useUnsavedChanges(!!name || !!location || selectedIds.length > 0 || sessionDate.getTime() !== defaultSessionDate.getTime() || deadlineDate.getTime() !== defaultDeadline.getTime() || useDeadline, saving, "/games/sessions");
  // DatePicker state
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const showPicker = (target: PickerTarget) => setPickerTarget(target);
  const hidePicker = () => setPickerTarget(null);
  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") hidePicker();
    if (!selected || !pickerTarget) return;
    if (pickerTarget === "session_date" || pickerTarget === "session_time") {
      const merged = new Date(sessionDate);
      if (pickerTarget === "session_date") {
        merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      setSessionDate(merged);
    } else {
      const merged = new Date(deadlineDate);
      if (pickerTarget === "deadline_date") {
        merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      setDeadlineDate(merged);
    }
  };
  /* ── Validation ── */
  const nameError = name.trim().length > 0 && name.trim().length < 3
    ? t("sessions.nameError") : null;
  const sessionInPast = sessionDate < new Date();
  const deadlineAfterSession = useDeadline && deadlineDate >= sessionDate;
  const deadlineInPast = useDeadline && deadlineDate < new Date();
  const canSave = name.trim().length >= 3
    && !sessionInPast
    && !deadlineAfterSession
    && !deadlineInPast
    && !saving;
  /* ── Friend toggle ── */
  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  /* ── Submit ── */
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const created = await createSession({
        name: name.trim(),
        location: location.trim() || undefined,
        scheduledStartDate: sessionDate.toISOString(),
        responseDeadline: useDeadline ? deadlineDate.toISOString() : undefined,
        playerIds: selectedIds,
      });
      if (created) {
        navigationGuard.allowExit();
        Alert.alert(
          t("sessions.created"),
          selectedIds.length > 0
            ? t("sessions.inviteCount", { count: selectedIds.length })
            : t("sessions.inviteLater"),
          [{ text: "OK", onPress: () => router.replace(`/(app)/games/sessions/${created.id}`) }]
        );
      }
    } finally {
      setSaving(false);
    }
  };
  const friendList = useMemo(() => friends ?? [], [friends]);
  const currentPickerMode = pickerTarget?.includes("time") ? "time" : "date";
  const currentPickerValue = pickerTarget?.startsWith("session") ? sessionDate : deadlineDate;
  /* ── Render ── */
  return (
    <ScreenLayout title={t("sessions.createTitle")} keyboard mode="cancel" onCancel={navigationGuard.cancel}>
      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {createError && <Text accessibilityRole="alert" style={{ color: COLORS.error }}>{createError}</Text>}
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>{t("sessions.createIntro")}</Text>
        </View>
        {/* ── Card: Detalhes ── */}
        <View style={styles.card}>
          <CardTitle icon="event" label={t("sessions.details")} />
          <Field label={t("sessions.name")}>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={name} onChangeText={setName}
              placeholder={t("sessions.nameHint")}
              placeholderTextColor={COLORS.textMuted} maxLength={60} accessibilityLabel={t("sessions.name")}
            />
            {nameError && <Text style={styles.fieldError}>{nameError}</Text>}
            <Text style={styles.fieldHint}>{name.trim().length}/60</Text>
          </Field>
          <Field label={t("sessions.location")}>
            <TextInput
              style={styles.input}
              value={location} onChangeText={setLocation}
              placeholder={t("sessions.locationHint")}
              placeholderTextColor={COLORS.textMuted} accessibilityLabel={t("sessions.location")}
            />
          </Field>
        </View>
        {/* ── Card: Data da sessão ── */}
        <View style={styles.card}>
          <CardTitle icon="schedule" label={t("sessions.when")} />
          <View style={styles.dateRow}>
            <DateButton
              icon="calendar-today" label={t("sessions.date")}
              value={formatDate(sessionDate, locale)}
              onPress={() => showPicker("session_date")}
            />
            <DateButton
              icon="access-time" label={t("sessions.time")}
              value={formatTime(sessionDate, locale)}
              onPress={() => showPicker("session_time")}
              flex={0.55}
            />
          </View>
          {sessionInPast && (
            <Text style={styles.fieldError}>{t("sessions.pastSession")}</Text>
          )}
          {/* iOS inline picker */}
          {Platform.OS === "ios" && pickerTarget?.startsWith("session") && (
            <InlinePicker
              value={currentPickerValue}
              mode={currentPickerMode}
              onChange={onDateChange}
              onDone={hidePicker}
              minimumDate={new Date()}
            />
          )}
          {Platform.OS === "android" && pickerTarget?.startsWith("session") && (
            <DateTimePicker
              value={currentPickerValue}
              mode={currentPickerMode}
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
              is24Hour
            />
          )}
        </View>
        {/* ── Card: Prazo de resposta ── */}
        <View style={styles.card}>
          <View style={styles.deadlineHeader}>
            <CardTitle icon="timer" label={t("sessions.deadline")} />
            <TouchableOpacity
              style={[styles.toggle, useDeadline && styles.toggleActive]}
              onPress={() => setUseDeadline((v) => !v)} accessibilityRole="switch" accessibilityLabel={t("sessions.deadline")} accessibilityState={{ checked: useDeadline }}
            >
              <Text style={[styles.toggleText, useDeadline && styles.toggleTextActive]}>
                {useDeadline ? t("sessions.enabled") : t("sessions.disabled")}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.deadlineHint}>
            {t("sessions.deadlineHint")}
          </Text>
          {useDeadline && (
            <>
              <View style={[styles.dateRow, { marginTop: 12 }]}>
                <DateButton
                  icon="calendar-today" label={t("sessions.deadlineDate")}
                  value={formatDate(deadlineDate, locale)}
                  onPress={() => showPicker("deadline_date")}
                />
                <DateButton
                  icon="access-time" label={t("sessions.time")}
                  value={formatTime(deadlineDate, locale)}
                  onPress={() => showPicker("deadline_time")}
                  flex={0.55}
                />
              </View>
              {deadlineInPast && (
                <Text style={styles.fieldError}>{t("sessions.pastDeadline")}</Text>
              )}
              {deadlineAfterSession && (
                <Text style={styles.fieldError}>{t("sessions.lateDeadline")}</Text>
              )}
              {/* iOS inline picker para deadline */}
              {Platform.OS === "ios" && pickerTarget?.startsWith("deadline") && (
                <InlinePicker
                  value={currentPickerValue}
                  mode={currentPickerMode}
                  onChange={onDateChange}
                  onDone={hidePicker}
                  minimumDate={new Date()}
                  maximumDate={sessionDate}
                />
              )}
              {Platform.OS === "android" && pickerTarget?.startsWith("deadline") && (
                <DateTimePicker
                  value={currentPickerValue}
                  mode={currentPickerMode}
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  maximumDate={sessionDate}
                  is24Hour
                />
              )}
            </>
          )}
        </View>
        {/* ── Card: Convidar amigos ── */}
        <View style={styles.card}>
          <CardTitle
            icon="people"
            label={t("sessions.inviteFriends") + (selectedIds.length ? ` (${selectedIds.length})` : "")}
          />
          {friendsLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : friendList.length === 0 ? (
            <View style={styles.emptyFriends}>
              <MaterialIcons name="person-add" size={32} color="#ccc" />
              <Text style={styles.emptyFriendsText}>
                {t("sessions.noFriends")}
              </Text>
            </View>
          ) : (
            <View>
              {friendList.map((item) => {
                const active = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.friendRow, active && styles.friendRowActive]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.8} accessibilityRole="checkbox" accessibilityLabel={t("sessions.selectFriend", { name: item.userName })} accessibilityState={{ checked: active }}
                  >
                    <View style={[styles.friendAvatar, active && styles.friendAvatarActive]}>
                      <Text style={[styles.friendAvatarText, active && { color: "#fff" }]}>
                        {item.userName[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.friendName, active && styles.friendNameActive]}>
                      {item.userName}
                    </Text>
                    <View style={[styles.friendCheck, active && styles.friendCheckActive]}>
                      {active && <MaterialIcons name="check" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {selectedIds.length > 0 && (
            <Text style={styles.inviteHint}>
              {t("sessions.inviteHint", { count: selectedIds.length })}
            </Text>
          )}
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>
      {/* Sticky save */}
      <View style={styles.stickyBar}>
        <PrimaryButton title={t("sessions.createTitle")} onPress={handleSave} disabled={!canSave} loading={saving} />
      </View>
    </ScreenLayout>
  );
}
/* ── Sub-components ── */
function CardTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.cardTitleRow}>
      <MaterialIcons name={icon as any} size={18} color={COLORS.primary} />
      <Text style={styles.cardTitleText}>{label}</Text>
    </View>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}
function DateButton({ icon, label, value, onPress, flex = 1 }: {
  icon: string; label: string; value: string; onPress: () => void; flex?: number;
}) {
  return (
    <TouchableOpacity
      style={styles.dateBtn}
      onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label + ": " + value}
    >
      <MaterialIcons name={icon as any} size={18} color={COLORS.primary} />
      <View style={{ marginLeft: 8, flex: 1, minWidth: 0 }}>
        <Text style={styles.dateBtnLabel}>{label}</Text>
        <Text style={styles.dateBtnValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}
function InlinePicker({ value, mode, onChange, onDone, minimumDate, maximumDate }: {
  value: Date; mode: "date" | "time";
  onChange: (e: DateTimePickerEvent, d?: Date) => void;
  onDone: () => void;
  minimumDate?: Date; maximumDate?: Date;
}) {
  const { t, i18n } = useTranslation("matches");
  return (
    <View style={styles.iosPickerWrap}>
      <DateTimePicker
        value={value} mode={mode} display="spinner"
        onChange={onChange}
        minimumDate={minimumDate} maximumDate={maximumDate}
        locale={i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB"}
      />
      <TouchableOpacity style={styles.iosPickerDone} onPress={onDone} accessibilityRole="button" accessibilityLabel={t("sessions.done")}>
        <Text style={styles.iosPickerDoneText}>{t("sessions.done")}</Text>
      </TouchableOpacity>
    </View>
  );
}
/* ── Styles ── */
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 20 },
  header: { marginBottom: 20 },
  headerSub: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 4 },
  card: { ...UI_STYLES.card, padding: 16, marginBottom: 16 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitleText: { ...UI_STYLES.section, flexShrink: 1 },
  field: { marginBottom: 12 },
  fieldLabel: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", marginBottom: 8 },
  fieldError: { ...UI_STYLES.caption, color: COLORS.error, marginTop: 4 },
  fieldHint: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 4, textAlign: "right" },
  input: { ...UI_STYLES.field },
  inputError: { borderColor: COLORS.error },
  dateRow: { gap: 12 },
  dateBtn: { ...UI_STYLES.field, minHeight: 64, flexDirection: "row", alignItems: "center" },
  dateBtnLabel: { ...UI_STYLES.caption, color: COLORS.textMuted },
  dateBtnValue: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700" },
  // Deadline toggle
  deadlineHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  toggle: { ...UI_STYLES.control, paddingHorizontal: 12, backgroundColor: COLORS.border },
  toggleActive: { backgroundColor: COLORS.primary + "18", borderColor: COLORS.primary },
  toggleText: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.primary },
  deadlineHint: { ...UI_STYLES.caption, color: COLORS.textMuted },
  iosPickerWrap: {
    marginTop: 12, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 8,
  },
  iosPickerDone: { ...UI_STYLES.button, backgroundColor: COLORS.primary, marginTop: 12 },
  iosPickerDoneText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyFriends: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyFriendsText: { ...UI_STYLES.empty },
  friendRow: { ...UI_STYLES.card, minHeight: 64, flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 8 },
  friendRowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  friendAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#e0e0e0", alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  friendAvatarActive: { backgroundColor: COLORS.primary },
  friendAvatarText: { fontSize: 15, fontWeight: "800", color: COLORS.textMuted },
  friendName: { ...UI_STYLES.body, color: COLORS.onBackground, flex: 1, fontWeight: "700" },
  friendNameActive: { color: COLORS.primary },
  friendCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#ddd",
    alignItems: "center", justifyContent: "center",
  },
  friendCheckActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inviteHint: { ...UI_STYLES.caption, color: COLORS.primary, marginTop: 12 },
  stickyBar: { padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
});
