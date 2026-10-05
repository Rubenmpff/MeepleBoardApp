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

import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Platform, FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";

import { COLORS } from "@/src/constants/colors";
import { useGameSessions } from "../hooks/useGameSessions";
import { useFriends } from "@/src/features/friends/hooks/useFriends";

/* ── Helpers ── */
function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-PT", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

type PickerTarget = "session_date" | "session_time" | "deadline_date" | "deadline_time";

/* ── Component ── */
export default function CreateSessionScreen() {
  const router = useRouter();
  const { createSession } = useGameSessions();
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
    ? "O nome deve ter pelo menos 3 caracteres." : null;

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
        Alert.alert(
          "✅ Sessão criada!",
          selectedIds.length > 0
            ? `${selectedIds.length} convite(s) enviado(s).`
            : "Podes convidar amigos mais tarde.",
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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Criar Sessão</Text>
          <Text style={styles.headerSub}>Agenda uma noite de jogos e convida os teus amigos.</Text>
        </View>

        {/* ── Card: Detalhes ── */}
        <View style={styles.card}>
          <CardTitle icon="event" label="Detalhes da sessão" />

          <Field label="Nome *">
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={name} onChangeText={setName}
              placeholder="Ex: Noite de jogos do Ruben"
              placeholderTextColor="#bbb" maxLength={60}
            />
            {nameError && <Text style={styles.fieldError}>{nameError}</Text>}
            <Text style={styles.fieldHint}>{name.trim().length}/60</Text>
          </Field>

          <Field label="Local (opcional)">
            <TextInput
              style={styles.input}
              value={location} onChangeText={setLocation}
              placeholder="Ex: Casa do Ruben, LeiriaCon..."
              placeholderTextColor="#bbb"
            />
          </Field>
        </View>

        {/* ── Card: Data da sessão ── */}
        <View style={styles.card}>
          <CardTitle icon="schedule" label="Quando é a sessão?" />

          <View style={styles.dateRow}>
            <DateButton
              icon="calendar-today" label="Data"
              value={formatDate(sessionDate)}
              onPress={() => showPicker("session_date")}
            />
            <DateButton
              icon="access-time" label="Hora"
              value={formatTime(sessionDate)}
              onPress={() => showPicker("session_time")}
              flex={0.55}
            />
          </View>
          {sessionInPast && (
            <Text style={styles.fieldError}>⚠️ A data tem de ser no futuro.</Text>
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
            <CardTitle icon="timer" label="Prazo de resposta" />
            <TouchableOpacity
              style={[styles.toggle, useDeadline && styles.toggleActive]}
              onPress={() => setUseDeadline((v) => !v)}
            >
              <Text style={[styles.toggleText, useDeadline && styles.toggleTextActive]}>
                {useDeadline ? "Ativado" : "Desativado"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.deadlineHint}>
            Se definires um prazo, a sessão será cancelada automaticamente se ninguém aceitar até essa data.
            Se não definires, o prazo é a data da sessão.
          </Text>

          {useDeadline && (
            <>
              <View style={[styles.dateRow, { marginTop: 12 }]}>
                <DateButton
                  icon="calendar-today" label="Data limite"
                  value={formatDate(deadlineDate)}
                  onPress={() => showPicker("deadline_date")}
                />
                <DateButton
                  icon="access-time" label="Hora"
                  value={formatTime(deadlineDate)}
                  onPress={() => showPicker("deadline_time")}
                  flex={0.55}
                />
              </View>

              {deadlineInPast && (
                <Text style={styles.fieldError}>⚠️ O prazo não pode ser no passado.</Text>
              )}
              {deadlineAfterSession && (
                <Text style={styles.fieldError}>⚠️ O prazo tem de ser antes da data da sessão.</Text>
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
            label={`Convidar amigos${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`}
          />

          {friendsLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : friendList.length === 0 ? (
            <View style={styles.emptyFriends}>
              <MaterialIcons name="person-add" size={32} color="#ccc" />
              <Text style={styles.emptyFriendsText}>
                Ainda não tens amigos.{"\n"}Podes convidar mais tarde.
              </Text>
            </View>
          ) : (
            <FlatList
              data={friendList}
              keyExtractor={(item: any) => item.id}
              scrollEnabled={false}
              renderItem={({ item }: any) => {
                const active = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.friendRow, active && styles.friendRowActive]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.8}
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
              }}
            />
          )}

          {selectedIds.length > 0 && (
            <Text style={styles.inviteHint}>
              {selectedIds.length} amigo(s) vão receber um convite quando criares a sessão.
            </Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky save */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Criar Sessão</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
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
      style={[styles.dateBtn, { flex }]}
      onPress={onPress} activeOpacity={0.8}
    >
      <MaterialIcons name={icon as any} size={18} color={COLORS.primary} />
      <View style={{ marginLeft: 8 }}>
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
  return (
    <View style={styles.iosPickerWrap}>
      <DateTimePicker
        value={value} mode={mode} display="spinner"
        onChange={onChange}
        minimumDate={minimumDate} maximumDate={maximumDate}
        locale="pt-PT"
      />
      <TouchableOpacity style={styles.iosPickerDone} onPress={onDone}>
        <Text style={styles.iosPickerDoneText}>Confirmar</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 20 },

  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  headerSub: { fontSize: 14, color: "#888", marginTop: 4 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitleText: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground },

  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground, marginBottom: 6 },
  fieldError: { fontSize: 12, color: COLORS.error, marginTop: 4, fontWeight: "600" },
  fieldHint: { fontSize: 11, color: "#bbb", marginTop: 4, textAlign: "right" },
  input: {
    borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12,
    padding: 12, fontSize: 14, backgroundColor: "#fff", color: COLORS.onBackground,
  },
  inputError: { borderColor: COLORS.error },

  dateRow: { flexDirection: "row", gap: 10 },
  dateBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.primary + "0D", borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: COLORS.primary + "30",
  },
  dateBtnLabel: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  dateBtnValue: { fontSize: 13, color: COLORS.onBackground, fontWeight: "600", marginTop: 2 },

  // Deadline toggle
  deadlineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggle: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#ddd",
  },
  toggleActive: { backgroundColor: COLORS.primary + "18", borderColor: COLORS.primary },
  toggleText: { fontSize: 12, fontWeight: "700", color: "#aaa" },
  toggleTextActive: { color: COLORS.primary },
  deadlineHint: { fontSize: 12, color: "#888", marginTop: 8, lineHeight: 17 },

  iosPickerWrap: {
    marginTop: 12, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 8,
  },
  iosPickerDone: {
    alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.primary, borderRadius: 10, marginTop: 8,
  },
  iosPickerDoneText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyFriends: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyFriendsText: { fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 20 },
  friendRow: {
    flexDirection: "row", alignItems: "center", padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: "#eee",
    marginBottom: 8, backgroundColor: "#fafafa",
  },
  friendRowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  friendAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#e0e0e0", alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  friendAvatarActive: { backgroundColor: COLORS.primary },
  friendAvatarText: { fontSize: 15, fontWeight: "800", color: "#888" },
  friendName: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.onBackground },
  friendNameActive: { color: COLORS.primary },
  friendCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#ddd",
    alignItems: "center", justifyContent: "center",
  },
  friendCheckActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inviteHint: {
    fontSize: 12, color: COLORS.primary, fontStyle: "italic",
    marginTop: 8, textAlign: "center",
  },

  stickyBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1, borderTopColor: "#eee",
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});