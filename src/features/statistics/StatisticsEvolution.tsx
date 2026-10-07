import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
import { Summary } from "./types";
import { styles } from "./styles";

type Props = { buckets: Summary["evolution"]; unit: Summary["bucketUnit"]; language: string;
 title: string; countLabel: (count: number) => string; onSelect: (bucket: string) => void };

export default function StatisticsEvolution({ buckets, unit, language, title, countLabel, onSelect }: Props) {
 const { width, fontScale } = useWindowDimensions();
 const maximum = Math.max(1, ...buckets.map(bucket => bucket.matches));
 const columnWidth = Math.max(52, Math.ceil(48 * fontScale), (Math.min(width, 680) - 68) / Math.max(1, buckets.length));
 const label = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(language, unit === "month" ? { month: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" })
   .format(new Date(Date.UTC(year, month - 1, day || 1)));
 };
 return <View style={styles.card}>
  <Text style={styles.title} accessibilityRole="header">{title}</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled" contentContainerStyle={chart.columns}>
   {buckets.map(bucket => <TouchableOpacity key={bucket.key} style={[chart.column, { width: columnWidth }]}
    accessibilityRole="button" accessibilityLabel={`${bucket.key}: ${countLabel(bucket.matches)}`} onPress={() => onSelect(bucket.key)}>
    <Text style={chart.count}>{bucket.matches}</Text>
    <View style={chart.plot}>
     <View style={[chart.bar, { height: 112 * bucket.matches / maximum }]} />
    </View>
    <Text style={chart.label}>{label(bucket.key)}</Text>
   </TouchableOpacity>)}
  </ScrollView>
 </View>;
}

const chart = StyleSheet.create({
 columns: { paddingVertical: 8 }, column: { minHeight: 44, alignItems: "center", paddingHorizontal: 4, gap: 6 },
 count: { ...theme.text.body, color: theme.colors.text, fontWeight: "600" },
 plot: { height: 112, width: "100%", justifyContent: "flex-end", alignItems: "center", borderBottomWidth: 1, borderColor: "#DED6E8", backgroundColor: "#F8F5FC" },
 bar: { width: "60%", maxWidth: 36, backgroundColor: theme.colors.primary, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
 label: { ...theme.text.body, color: theme.colors.muted, textAlign: "center" },
});
