/**
 * «Duração da partida»: hours and minutes, «Não sei», and Medida/Estimativa once there is a value (estimate by
 * default). An unusual value (below 5 min or above 6 h) asks for confirmation and is never changed.
 * Used by the registration (required answer) and by the duration correction of a recorded match.
 */
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph, Segmented } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { checkDuration, DurationDraft, emptyDuration } from "../utils/matchDuration";
import { formatDuration } from "@/src/ui/format";

type Props = { value: DurationDraft; onChange: (value: DurationDraft) => void; showError?: boolean; required?: boolean };

export default function DurationField({ value, onChange, showError = false, required = true }: Props) {
  const { t, i18n } = useTranslation("matches");
  const unknown = value.method === "Unknown";
  const check = checkDuration(value);
  const hasValue = !!(value.hours.trim() || value.minutes.trim());
  const set = (patch: Partial<DurationDraft>) => onChange({ ...value, ...patch });
  // Typing a value answers the question: it becomes an estimate unless the person says it was timed.
  const type_ = (key: "hours" | "minutes", text: string) => set({ [key]: text.replace(/[^\d]/g, "").slice(0, 3), confirmed: false,
    method: value.method === "Measured" ? "Measured" : "Estimated" } as Partial<DurationDraft>);
  const field = (key: "hours" | "minutes") => <View style={styles.box}>
    <TextInput style={[styles.input, unknown && styles.dim]} value={unknown ? "" : value[key]} onChangeText={text => type_(key, text)}
      keyboardType="number-pad" placeholder="–" placeholderTextColor={colors.placeholder} maxLength={3} selectTextOnFocus
      accessibilityLabel={t(key === "hours" ? "duration.hoursLabel" : "duration.minutesLabel")} />
    <Text style={type.caption}>{t(key === "hours" ? "duration.h" : "duration.min")}</Text>
  </View>;

  const message = (() => {
    if (unknown) return { tone: "hint" as const, text: t("duration.unknownHint") };
    if (check.state === "invalid" && hasValue) return { tone: "error" as const, text: t(check.reason === "minutes" ? "duration.minutesRange" : check.reason === "zero" ? "duration.zero" : "duration.format") };
    if (check.state === "value" && check.unusual && !value.confirmed) return { tone: "confirm" as const, text: t(check.unusual === "long" ? "duration.long" : "duration.short", { value: formatDuration(check.minutes, i18n.language) }) };
    if (showError && required && check.state === "unanswered") return { tone: "error" as const, text: t("duration.error") };
    return { tone: "hint" as const, text: t("duration.hint") };
  })();

  return <View style={styles.card}>
    <View style={styles.head}>
      <View style={styles.titleRow}><Text style={type.head}>{t("duration.title")}</Text>{required && <Text style={styles.tag}>{t("duration.required").toUpperCase()}</Text>}</View>
      {(hasValue || unknown) && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("duration.clearLabel")} onPress={() => onChange(emptyDuration)} style={styles.link}>
        <Text style={styles.linkText}>{t("duration.clear")}</Text>
      </TouchableOpacity>}
    </View>
    <View style={styles.row}>
      {field("hours")}{field("minutes")}
      <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: unknown }} accessibilityLabel={t("duration.unknown")}
        onPress={() => onChange(unknown ? emptyDuration : { ...emptyDuration, method: "Unknown" })} style={[styles.chip, unknown && styles.chipOn]}>
        {unknown && <Glyph name="check" size={16} color={colors.primary} />}
        <Text style={[type.body, strong, unknown && { color: colors.primary }]}>{t("duration.unknown")}</Text>
      </TouchableOpacity>
    </View>
    {hasValue && !unknown && <Segmented role="button" items={[{ key: "Measured", label: t("duration.measured") }, { key: "Estimated", label: t("duration.estimated") }]}
      value={value.method === "Measured" ? "Measured" : value.method === "Estimated" ? "Estimated" : ("" as "Measured")} onChange={method => set({ method })} />}
    {hasValue && !unknown && value.method == null && <Text style={type.caption}>{t("duration.notStated")}</Text>}
    <View style={styles.message} accessibilityLiveRegion="polite">
      {message.tone !== "hint" && <Glyph name="alert-circle-outline" size={16} color={message.tone === "error" ? colors.danger : colors.pendingText} />}
      <Text style={[type.caption, styles.flex, message.tone === "error" && { color: colors.danger }, message.tone === "confirm" && { color: colors.pendingText }]}>{message.text}</Text>
      {message.tone === "confirm" && <TouchableOpacity accessibilityRole="button" onPress={() => set({ confirmed: true })} style={styles.link}>
        <Text style={styles.linkText}>{t("duration.confirm")}</Text>
      </TouchableOpacity>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.md },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  title: { flexShrink: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm, flexShrink: 1 },
  tag: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.3, color: colors.muted, backgroundColor: colors.track, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: "hidden" },
  link: { minHeight: touch, minWidth: touch, justifyContent: "center", alignItems: "flex-end" },
  linkText: { ...type.body, ...strong, color: colors.primary },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm },
  box: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  input: { minWidth: 56, minHeight: touch + 2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background,
    paddingHorizontal: space.sm, fontSize: 20, fontWeight: "700", color: colors.text, textAlign: "center", fontVariant: ["tabular-nums"] },
  dim: { opacity: 0.45 },
  chip: { marginLeft: "auto", minHeight: touch, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
    flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  message: { flexDirection: "row", alignItems: "center", gap: 6 },
  flex: { flex: 1 },
});
