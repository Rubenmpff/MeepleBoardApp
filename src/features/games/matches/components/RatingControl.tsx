/**
 * «A tua avaliação» in the registration: a large «7,5 / 10», a 0–10 bar and ±0,5 buttons. No dragging needed:
 * tapping the bar picks the nearest half point; with VoiceOver it is an adjustable control (swipe up/down = ±0,5),
 * read as «7,5 de 10». Zero is a chosen value; «Limpar» goes back to «not rated yet», which is not zero.
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";

/** note: the closed-rating rule, shown above the hint (the registration and the diary word it differently). */
type Props = { value?: number; onChange: (value: number | undefined) => void; showError?: boolean; note?: string };

const clamp = (v: number) => Math.min(10, Math.max(0, Math.round(v * 2) / 2));

export default function RatingControl({ value, onChange, showError = false, note }: Props) {
  const { t, i18n } = useTranslation("matches");
  const [width, setWidth] = useState(0);
  const format = (v: number) => new Intl.NumberFormat(i18n.language, { minimumFractionDigits: v % 1 ? 1 : 0, maximumFractionDigits: 1 }).format(v);
  const step = (delta: number) => onChange(clamp(value === undefined ? (delta > 0 ? 0.5 : 0) : value + delta));
  const pct = value === undefined ? 0 : value * 10;
  return <View style={styles.card}>
    <View style={styles.head}>
      <View style={styles.titleRow}><Text style={type.head}>{t("rating.title")}</Text><Text style={styles.tag}>{t("rating.required").toUpperCase()}</Text></View>
      {value !== undefined && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("rating.clearLabel")} onPress={() => onChange(undefined)} style={styles.link}>
        <Text style={styles.linkText}>{t("rating.clear")}</Text>
      </TouchableOpacity>}
    </View>
    <View style={styles.big} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text style={[styles.value, value === undefined && styles.empty]}>{value === undefined ? "—" : format(value)}</Text>
      <Text style={styles.scale}> / 10</Text>
    </View>
    {value === undefined && <Text style={[type.caption, styles.center]}>{t("rating.notRated")}</Text>}
    <View style={styles.controls}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("rating.minus")} onPress={() => step(-0.5)} disabled={value === 0}
        style={[styles.button, value === 0 && styles.disabled]}><Text style={styles.buttonText}>{t("rating.minusShort")}</Text></TouchableOpacity>
      <Pressable style={styles.track} onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onPress={e => width > 0 && onChange(clamp((e.nativeEvent.locationX / width) * 10))}
        accessible accessibilityRole="adjustable" accessibilityLabel={t("rating.title")}
        accessibilityValue={value === undefined ? { text: t("rating.notRated") } : { min: 0, max: 10, now: value, text: t("rating.spoken", { value: format(value) }) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={e => step(e.nativeEvent.actionName === "increment" ? 0.5 : -0.5)}>
        <View style={styles.bar} />
        {value !== undefined && <View style={[styles.fill, { width: `${pct}%` }]} />}
        {Array.from({ length: 11 }, (_, i) => <View key={i} style={[styles.tick, { left: `${i * 10}%` }]} />)}
        {value !== undefined && <View style={[styles.knob, { left: `${pct}%` }]} />}
      </Pressable>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("rating.plus")} onPress={() => step(0.5)} disabled={value === 10}
        style={[styles.button, value === 10 && styles.disabled]}><Text style={styles.buttonText}>{t("rating.plusShort")}</Text></TouchableOpacity>
    </View>
    <View style={styles.marks} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {["0", "5", "10"].map(m => <Text key={m} style={type.micro}>{m}</Text>)}
    </View>
    {!!note && <View style={styles.rule}><Glyph name="lock-outline" size={16} color={colors.pendingText} /><Text style={[type.caption, styles.ruleText]}>{note}</Text></View>}
    {showError && value === undefined
      ? <View style={styles.message} accessibilityLiveRegion="polite"><Glyph name="alert-circle-outline" size={16} color={colors.danger} /><Text style={[type.caption, { color: colors.danger, flex: 1 }]}>{t("rating.error")}</Text></View>
      : <Text style={type.caption}>{t("rating.hint")}</Text>}
  </View>;
}

const KNOB = 26;
const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  title: { flexShrink: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm, flexShrink: 1 },
  tag: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.3, color: colors.muted, backgroundColor: colors.track, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: "hidden" },
  link: { minHeight: touch, minWidth: touch, justifyContent: "center", alignItems: "flex-end" },
  linkText: { ...type.body, ...strong, color: colors.primary },
  big: { flexDirection: "row", alignItems: "baseline", justifyContent: "center" },
  value: { fontSize: 40, lineHeight: 46, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  empty: { color: "#B9B3C0" },
  scale: { ...type.body, color: colors.muted },
  center: { textAlign: "center", marginTop: -4 },
  controls: { flexDirection: "row", alignItems: "center", gap: space.md },
  button: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  buttonText: { ...type.caption, ...strong, color: colors.primary, fontVariant: ["tabular-nums"] },
  disabled: { opacity: 0.4 },
  track: { flex: 1, height: touch, justifyContent: "center" },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.track },
  fill: { position: "absolute", left: 0, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  tick: { position: "absolute", width: 2, height: 8, marginLeft: -1, backgroundColor: "rgba(255,255,255,0.7)" },
  knob: { position: "absolute", width: KNOB, height: KNOB, marginLeft: -KNOB / 2, borderRadius: KNOB / 2, backgroundColor: colors.card, borderWidth: 3, borderColor: colors.gold,
    shadowColor: "#30283D", shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  marks: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 48 + space.md },
  message: { flexDirection: "row", alignItems: "center", gap: 6 },
  rule: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: space.sm + 2, borderRadius: radius.control, backgroundColor: colors.pendingSoft, borderWidth: 1, borderColor: colors.pendingLine },
  ruleText: { flex: 1, color: colors.pendingText },
});
