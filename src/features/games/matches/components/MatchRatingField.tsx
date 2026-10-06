import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

// Ten compact stars; half-point controls remain explicit and accessible.
export default function MatchRatingField({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) {
  const { t } = useTranslation("matches");
  return <View style={styles.row}>
    <Text style={styles.label}>{t("form.ratingTitle")}</Text>
    <Text style={styles.hint}>{t("form.ratingHint")}</Text>
    <View style={styles.stars}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(point => <TouchableOpacity key={point}
        style={styles.starButton} accessibilityRole="button" accessibilityLabel={t("form.starRating", { value: point })}
        accessibilityState={{ selected: value === point }} onPress={() => onChange(point)}>
        <View style={styles.starGlyph}>
          <Text allowFontScaling={false} style={[styles.star, { color: value !== undefined && value >= point ? COLORS.secondary : COLORS.textMuted }]}>★</Text>
          {value === point - 0.5 && <View style={styles.half}><Text allowFontScaling={false} style={[styles.star, { color: COLORS.secondary }]}>★</Text></View>}
        </View>
        <Text style={styles.number}>{point}</Text>
      </TouchableOpacity>)}
    </View>
    <View style={styles.controls}>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.starRating", { value: 0 })}
        accessibilityState={{ selected: value === 0 }} onPress={() => onChange(0)}><Text style={styles.clear}>0</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.ratingDecrease")}
        disabled={value !== undefined && value <= 0} onPress={() => onChange(Math.max(0, (value ?? 0) - 0.5))}>
        <Text style={styles.action}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{value === undefined ? t("form.notRated") : `${value}/10`}</Text>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.ratingIncrease")}
        disabled={value !== undefined && value >= 10} onPress={() => onChange(Math.min(10, (value ?? 0) + 0.5))}>
        <Text style={styles.action}>+</Text>
      </TouchableOpacity>
      {value !== undefined && <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.ratingClear")} onPress={() => onChange(undefined)}>
        <Text style={styles.clear}>{t("form.ratingClear")}</Text>
      </TouchableOpacity>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  stars: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  starButton: { width: "18%", minWidth: 44, minHeight: 56, alignItems: "center", justifyContent: "center" },
  starGlyph: { width: 30, height: 34, position: "relative" },
  star: { fontSize: 30, lineHeight: 34 },
  half: { position: "absolute", width: 15, overflow: "hidden", left: 0, top: 0 },
  number: { ...UI_STYLES.caption, color: COLORS.onBackground },
  hint: { ...UI_STYLES.caption, color: COLORS.textMuted },
  row: { gap: 6, marginBottom: 10 },
  label: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.onBackground },
  controls: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  button: { ...UI_STYLES.control, minWidth: 44, paddingHorizontal: 10, alignItems: "center", backgroundColor: COLORS.primarySoft },
  action: { fontSize: 22, color: COLORS.primary, fontWeight: "700" },
  value: { ...UI_STYLES.body, minWidth: 60, textAlign: "center", color: COLORS.onBackground },
  clear: { ...UI_STYLES.caption, color: COLORS.primary },
});
