import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

// Same 0–10 / half-point values, without a grid of twenty oversized touch areas.
export default function MatchRatingField({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) {
  const { t } = useTranslation("matches");
  return <View style={styles.row}>
    <Text style={styles.label}>{t("details.ratingLabel")}</Text>
    <View style={styles.controls}>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.ratingDecrease")}
        disabled={value !== undefined && value <= 0} onPress={() => onChange(Math.max(0, (value ?? 0) - 0.5))}>
        <Text style={styles.action}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{value === undefined ? "—" : `${value}/10`}</Text>
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
  row: { gap: 6, marginBottom: 10 },
  label: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.onBackground },
  controls: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  button: { ...UI_STYLES.control, minWidth: 44, paddingHorizontal: 10, alignItems: "center", backgroundColor: COLORS.primarySoft },
  action: { fontSize: 22, color: COLORS.primary, fontWeight: "700" },
  value: { ...UI_STYLES.body, minWidth: 60, textAlign: "center", color: COLORS.onBackground },
  clear: { ...UI_STYLES.caption, color: COLORS.primary },
});
