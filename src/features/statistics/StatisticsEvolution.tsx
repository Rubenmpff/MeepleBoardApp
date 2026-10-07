import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
import { Summary } from "./types";
import { styles } from "./styles";

type Props = { buckets: Summary["evolution"]; unit: Summary["bucketUnit"]; language: string;
 title: string; countLabel: (count: number) => string; onSelect: (bucket: string) => void };

export default function StatisticsEvolution({ buckets, unit, language, title, countLabel, onSelect }: Props) {
 const { width, fontScale } = useWindowDimensions();
 const { t } = useTranslation("statistics");
 const peak = Math.max(0, ...buckets.map(bucket => bucket.matches));
 // Whole-number ceiling shared by all columns; no minimum visible bar for zero.
 const ceiling = peak <= 1 ? peak : Math.ceil(peak / 2) * 2;
 const columnWidth = Math.max(60, Math.ceil(60 * fontScale), (Math.min(width, 680) - 32) / Math.max(1, buckets.length));
 const date = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day || 1));
 };
 const label = (key: string) => new Intl.DateTimeFormat(language, unit === "month"
  ? { month: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" }).format(date(key));
 const accessibleDate = (key: string) => new Intl.DateTimeFormat(language, unit === "month"
  ? { month: "long", year: "numeric", timeZone: "UTC" } : { dateStyle: "long", timeZone: "UTC" }).format(date(key));
 return <View style={styles.section}>
  <Text style={styles.title} accessibilityRole="header">{title}</Text>
  <Text style={styles.muted}>{peak > 0 ? t("chartScale", { maximum: ceiling }) : t("chartEmpty")}</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled" contentContainerStyle={chart.columns}>
   {buckets.map(bucket => <TouchableOpacity key={bucket.key} style={[chart.column, { width: columnWidth }]}
    accessibilityRole="button" accessibilityLabel={`${accessibleDate(bucket.key)}: ${countLabel(bucket.matches)}`} onPress={() => onSelect(bucket.key)}>
    <Text style={chart.count}>{bucket.matches}</Text>
    <View style={chart.plot}>
     {bucket.matches > 0 && <View testID={`statistics-bar-${bucket.key}`} style={[chart.bar, { height: 112 * bucket.matches / ceiling }]} />}
    </View>
    <Text style={chart.label}>{label(bucket.key)}</Text>
   </TouchableOpacity>)}
  </ScrollView>
 </View>;
}

const chart = StyleSheet.create({
 columns: { paddingVertical: 8 }, column: { minHeight: 44, alignItems: "center", gap: 6 },
 count: { ...theme.text.body, color: theme.colors.text, fontWeight: "600" },
 // Empty plotting space is transparent: it cannot resemble a coloured data column.
 plot: { height: 112, width: "100%", justifyContent: "flex-end", alignItems: "center", borderBottomWidth: 1, borderColor: "#DED6E8" },
 bar: { width: "55%", maxWidth: 32, backgroundColor: theme.colors.primary, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
 label: { ...theme.text.body, color: theme.colors.muted, textAlign: "center", paddingHorizontal: 4 },
});
