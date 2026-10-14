/**
 * When the session starts and ends, in the viewer's local time, known from the moment it is created:
 * it starts at the scheduled time (accepting never moves it) and ends 24 h later. The organizer of a
 * running session can extend it or choose another end time, up to 48 h after the scheduled time.
 */
import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import Sheet from "@/src/ui/Sheet";
import { Card, Note, Row } from "@/src/ui/components";
import { colors, space, type } from "@/src/ui/theme";
import { formatDateTime } from "@/src/ui/format";
import sessionService from "../services/sessionService";
import { GameSession } from "../types/GameSession";
import { normalizeInviteStatus } from "../types/GameSessionPlayer";

const HOUR = 3600_000;
// Leave a margin so a choice made now is still in the future when it reaches the API.
const MIN_LEAD = 5 * 60_000;

export default function SessionEndTime({ session, canChange, onChanged }: { session: GameSession; canChange: boolean; onChanged: (session: GameSession) => void }) {
  const { t, i18n } = useTranslation("matches");
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [androidPicker, setAndroidPicker] = useState<"date" | "time" | null>(null);
  const when = (value: string | Date) => formatDateTime(value, i18n.language);

  const end = session.autoCloseAt ? new Date(session.autoCloseAt) : null;
  const latest = session.latestCloseAt ? new Date(session.latestCloseAt) : null;
  const active = session.status === "Active";
  if (session.status === "Cancelled" || !session.scheduledStartDate) return null;
  const starts = t(session.status === "Upcoming" ? "sessions.end.starts" : "sessions.end.started", { date: when(session.scheduledStartDate) });
  const text = session.status === "Closed" && session.endDate
    ? t(session.closedAutomatically ? "sessions.end.endedAuto" : "sessions.end.ended", { date: when(session.endDate) })
    : end ? t(session.closeTimeChosen ? "sessions.end.endsChosen" : "sessions.end.ends", { date: when(end) }) : null;
  if (!text) return null;
  // Without a confirmed guest it never runs; the cleanup job cancels it at the response deadline.
  const unconfirmed = session.status === "Upcoming" && !(session.players ?? []).some(p => !p.isOrganizer && normalizeInviteStatus(p.status) === "Accepted");

  const earliest = () => new Date(Date.now() + MIN_LEAD);
  const editable = canChange && active && !!end && !!latest;
  const atMaximum = editable && end!.getTime() >= latest!.getTime() - 60_000;
  // Quick choices from the current end, kept inside the allowed window.
  const options = editable ? [
    ...[1, 3, 6].map(hours => ({ key: `+${hours}`, label: t("sessions.end.plusHours", { count: hours }), value: new Date(end!.getTime() + hours * HOUR) }))
      .filter(o => o.value < latest! && o.value > earliest()),
    { key: "max", label: t("sessions.end.maximum"), value: latest! },
  ] : [];
  const valid = (value: Date) => value > earliest() && !!latest && value <= latest;

  async function save() {
    if (!choice || !valid(choice)) { Alert.alert(t("sessions.end.error"), t("sessions.end.invalid", { date: latest ? when(latest) : "" })); return; }
    setSaving(true);
    try {
      onChanged(await sessionService.setCloseTime(session.id, choice));
      setOpen(false);
      Alert.alert(t("sessions.end.saved"));
    } catch (err: any) {
      Alert.alert(t("sessions.end.error"), err?.response?.data?.message ?? err?.message ?? "");
    } finally { setSaving(false); }
  }

  function pick(event: DateTimePickerEvent, value?: Date) {
    if (Platform.OS === "android") {
      setAndroidPicker(androidPicker === "date" && event.type === "set" ? "time" : null);
    }
    if (event.type !== "dismissed" && value) {
      const next = new Date(choice ?? end!);
      if (Platform.OS === "android" && androidPicker === "date") next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      else if (Platform.OS === "android") next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      else next.setTime(value.getTime());
      setChoice(next);
    }
  }

  return <>
    <Card>
      <Row first title={t("sessions.end.startTitle")} subtitle={starts} accessibilityLabel={`${t("sessions.end.startTitle")}: ${starts}`} />
      <Row title={t("sessions.end.title")} subtitle={text} accessibilityLabel={`${t("sessions.end.title")}: ${text}`} />
      {unconfirmed && <Row title={t("sessions.end.needsGuest", { date: when(session.effectiveDeadline ?? session.scheduledStartDate) })} />}
      {editable && (atMaximum
        ? <Row title={t("sessions.end.atMaximum")} />
        : <Row title={t("sessions.end.extend")} subtitle={t("sessions.end.extendHint", { date: when(latest!) })} tone="link"
          onPress={() => { setChoice(options[0]?.value ?? latest); setOpen(true); }} />)}
    </Card>

    {editable && <Sheet visible={open} title={t("sessions.end.sheetTitle")} onClose={() => setOpen(false)} closeLabel={t("sessions.end.close")}
      left={{ label: t("sessions.end.cancel"), onPress: () => setOpen(false) }}
      right={{ label: t("sessions.end.save"), bold: true, onPress: () => { if (!saving) void save(); } }}>
      <Note inset>{t("sessions.end.current", { date: when(end!) })}</Note>
      <Card>
        {options.map((o, i) => <Row key={o.key} first={i === 0} title={o.label} subtitle={when(o.value)} end="check"
          selected={!!choice && choice.getTime() === o.value.getTime()} onPress={() => setChoice(o.value)} />)}
        <Row first={options.length === 0} title={t("sessions.end.custom")} subtitle={choice && !options.some(o => o.value.getTime() === choice.getTime()) ? when(choice) : undefined}
          end="check" selected={!!choice && !options.some(o => o.value.getTime() === choice.getTime())}
          onPress={() => { if (Platform.OS === "android") setAndroidPicker("date"); else setChoice(c => c ?? end); }} />
      </Card>
      {Platform.OS === "ios" && <View style={styles.picker}>
        <DateTimePicker value={choice ?? end!} mode="datetime" display="spinner" themeVariant="light" textColor={colors.text}
          minimumDate={earliest()} maximumDate={latest!} onChange={pick} locale={i18n.language.startsWith("pt") ? "pt-PT" : "en-GB"} />
      </View>}
      {Platform.OS === "android" && androidPicker && <DateTimePicker value={choice ?? end!} mode={androidPicker} display="default" is24Hour
        minimumDate={earliest()} maximumDate={latest!} onChange={pick} />}
      <Note inset>{t("sessions.end.sheetNote", { date: when(latest!) })}</Note>
      {saving && <Text style={[type.caption, styles.center]} accessibilityLiveRegion="polite">{t("sessions.end.save")}…</Text>}
      {!valid(choice ?? end!) && <Text style={[type.caption, styles.error]} accessibilityRole="alert">{t("sessions.end.invalid", { date: when(latest!) })}</Text>}
    </Sheet>}
  </>;
}

const styles = StyleSheet.create({
  picker: { alignItems: "center" },
  center: { textAlign: "center" },
  error: { color: colors.danger, paddingHorizontal: space.lg },
});
