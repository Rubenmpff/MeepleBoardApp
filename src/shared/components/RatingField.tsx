import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { RATING_COLORS } from "@/src/styles/appTheme";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";

// The one rating editor (record a match, journal): 0–10 in half points.
// A star sets the whole value; − and + move half a point; 0 is a valid rating; Clear means "not rated".
export default function RatingField({ value, onChange, showTitle = true }: { value?: number; onChange: (value: number | undefined) => void; showTitle?: boolean }) {
  const { t, i18n } = useTranslation("matches");
  const shown = value === undefined ? t("form.notRated") : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(value);
  return <View style={styles.field}>
    {showTitle && <View style={styles.titles}>
      <Text style={[type.body, strong]}>{t("form.ratingTitle")}</Text>
      <Text style={type.caption}>{t("form.ratingHint")}</Text>
    </View>}
    <View style={styles.valueRow} accessible accessibilityLabel={value === undefined ? t("form.notRated") : t("form.ratingValue", { value: shown })}>
      <Text style={[styles.value, value === undefined && styles.valueEmpty]}>{shown}</Text>
      {value !== undefined && <Text style={type.caption}> / 10</Text>}
    </View>
    <View style={styles.stars}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(point => <TouchableOpacity key={point}
        style={styles.starButton} accessibilityRole="button" accessibilityLabel={t("form.starRating", { value: point })}
        accessibilityState={{ selected: value === point }} onPress={() => onChange(point)}>
        <View style={styles.starGlyph}>
          <Text allowFontScaling={false} style={[styles.star, { color: value !== undefined && value >= point ? RATING_COLORS.gold : RATING_COLORS.empty }]}>{value !== undefined && value >= point ? "★" : "☆"}</Text>
          {value === point - 0.5 && <View style={styles.half}><Text allowFontScaling={false} style={[styles.star, { color: RATING_COLORS.gold }]}>★</Text></View>}
          {value !== undefined && value >= point - 0.5 && <Text allowFontScaling={false} style={[styles.star, styles.outline]}>☆</Text>}
        </View>
        <Text style={type.micro}>{point}</Text>
      </TouchableOpacity>)}
    </View>
    <View style={styles.controls}>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.starRating", { value: 0 })}
        accessibilityState={{ selected: value === 0 }} onPress={() => onChange(0)}><Text style={styles.buttonText}>0</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.ratingDecrease")}
        disabled={value !== undefined && value <= 0} onPress={() => onChange(Math.max(0, (value ?? 0) - 0.5))}>
        <Text style={styles.buttonText}>− 0,5</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={t("form.ratingIncrease")}
        disabled={value !== undefined && value >= 10} onPress={() => onChange(Math.min(10, (value ?? 0) + 0.5))}>
        <Text style={styles.buttonText}>+ 0,5</Text>
      </TouchableOpacity>
      {value !== undefined && <TouchableOpacity style={styles.clear} accessibilityRole="button" accessibilityLabel={t("form.ratingClear")} onPress={() => onChange(undefined)}>
        <Text style={[type.body, { color: colors.primary }]}>{t("form.ratingClear")}</Text>
      </TouchableOpacity>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: space.sm, marginBottom: space.md },
  titles: { gap: 2 },
  valueRow: { flexDirection: "row", alignItems: "baseline" },
  value: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  valueEmpty: { fontSize: 17, lineHeight: 22, fontWeight: "600", color: colors.muted },
  stars: { flexDirection: "row", flexWrap: "wrap", rowGap: space.xs },
  starButton: { width: "20%", minWidth: touch, minHeight: 56, alignItems: "center", justifyContent: "center" },
  starGlyph: { width: 30, height: 34, position: "relative" },
  star: { fontSize: 30, lineHeight: 34 },
  outline: { position: "absolute", left: 0, top: 0, color: RATING_COLORS.outline },
  half: { position: "absolute", width: 15, overflow: "hidden", left: 0, top: 0 },
  controls: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm },
  button: { minHeight: touch, minWidth: touch, paddingHorizontal: space.md, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  buttonText: { ...type.body, color: colors.primary, fontWeight: "600" },
  clear: { minHeight: touch, justifyContent: "center", paddingHorizontal: space.sm },
});
