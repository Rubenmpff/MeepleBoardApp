import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Summary } from "../types/Statistics";
import { Card, Row } from "@/src/ui/components";
import { colors, space, type } from "@/src/ui/theme";

type Props = { compact?: boolean; buckets: Summary["evolution"]; unit: Summary["bucketUnit"]; language: string;
 title: string; countLabel: (count: number) => string; onSelect: (bucket: string) => void };

const PLOT = 104, RESERVE = 18, AXIS = 24, DIGIT = 7;

// The chart card: every bucket returned by the API, zeros included; no minimum bar for zero.
export default function StatisticsEvolution({ buckets, unit, language, title, countLabel, onSelect }: Props) {
 const { width, fontScale } = useWindowDimensions();
 const { t } = useTranslation("statistics");
 const [details, setDetails] = useState(false);
 const overview = unit === "month" && buckets.length > 0 && buckets.length <= 24;
 const peak = Math.max(0, ...buckets.map(bucket => bucket.matches));
 // Whole-number ceiling shared by all columns.
 const ceiling = peak <= 1 ? peak : Math.ceil(peak / 2) * 2;
 const date = (key: string) => { const [year, month, day] = key.split("-").map(Number); return new Date(Date.UTC(year, month - 1, day || 1)); };
 const label = (key: string) => new Intl.DateTimeFormat(language, unit === "month" ? { month: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" }).format(date(key));
 const accessibleDate = (key: string) => new Intl.DateTimeFormat(language, unit === "month" ? { month: "long", year: "numeric", timeZone: "UTC" } : { dateStyle: "long", timeZone: "UTC" }).format(date(key));
 const height = (n: number) => ceiling ? PLOT * n / ceiling : 0;
 // The axis column grows with the widest label so three-digit years do not wrap.
 const axis = Math.max(AXIS, Math.ceil((String(ceiling).length * DIGIT + 6) * fontScale));
 const showValues = fontScale <= 1.25 && buckets.length <= 12;
 const every = Math.ceil(buckets.length / (fontScale > 1.25 ? 3 : 6));
 const grid = <>{[ceiling, ceiling / 2, 0].map((value, index) => <View key={index} style={[c.grid, { left: axis, top: RESERVE + PLOT * index / 2 }, index === 2 && c.baseline]}>
  <Text style={[type.micro, c.axis, { left: -axis, width: axis - 6 }]} numberOfLines={1}>{Number.isInteger(value) ? value : ""}</Text>
 </View>)}</>;
 const columnWidth = Math.max(44, Math.ceil(44 * fontScale), (Math.min(width, 680) - 64 - axis) / Math.max(1, buckets.length));
 return <Card>
  {peak === 0 && <Text style={[type.body, { color: colors.muted, padding: space.lg }]}>{t("chartEmpty")}</Text>}
  {peak > 0 && overview && <TouchableOpacity style={c.pad} accessibilityRole="button" accessibilityLabel={`${title}. ${buckets.map(bucket => `${accessibleDate(bucket.key)}: ${countLabel(bucket.matches)}`).join("; ")}`}
   accessibilityHint={t("consultMonths")} onPress={() => setDetails(v => !v)}>
   <View style={{ paddingLeft: axis }} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
    {grid}
    <View style={[c.plot, { height: PLOT + RESERVE }]}>
     {buckets.map(bucket => <View key={bucket.key} style={c.column}>
      {showValues && bucket.matches > 0 && <Text style={[type.micro, c.value]}>{bucket.matches}</Text>}
      {bucket.matches > 0 && <View testID={`statistics-bar-${bucket.key}`} style={[c.bar, { height: height(bucket.matches) }]} />}
     </View>)}
    </View>
    <View style={c.labels}>{buckets.map((bucket, index) => <View key={bucket.key} style={[c.labelCell, { height: Math.ceil(16 * fontScale) }]}>{index % every === 0 && <Text style={[type.micro, c.monthLabel]} numberOfLines={1}>{label(bucket.key)}</Text>}</View>)}</View>
   </View>
  </TouchableOpacity>}
  {peak > 0 && !overview && <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled" contentContainerStyle={c.columns}>
   {buckets.map(bucket => <TouchableOpacity key={bucket.key} style={[c.dayColumn, { width: columnWidth }]} accessibilityRole="button"
    accessibilityLabel={`${accessibleDate(bucket.key)}: ${countLabel(bucket.matches)}`} onPress={() => onSelect(bucket.key)}>
    <Text style={[type.micro, c.center, { color: bucket.matches ? colors.text : colors.muted }]}>{bucket.matches}</Text>
    <View style={c.dayPlot}>{bucket.matches > 0 && <View testID={`statistics-bar-${bucket.key}`} style={[c.bar, { height: height(bucket.matches) }]} />}</View>
    <Text style={[type.micro, c.center]}>{label(bucket.key)}</Text>
   </TouchableOpacity>)}
  </ScrollView>}
  {overview && <Row title={t("consultMonths")} end={details ? "collapse" : "expand"} onPress={() => setDetails(v => !v)} accessibilityLabel={t("consultMonths")} />}
  {overview && details && buckets.map(bucket => <Row key={bucket.key} title={accessibleDate(bucket.key)} value={String(bucket.matches)}
   accessibilityLabel={`${accessibleDate(bucket.key)}: ${countLabel(bucket.matches)}`} onPress={() => onSelect(bucket.key)} />)}
 </Card>;
}

const c = StyleSheet.create({
 pad: { padding: space.lg, paddingBottom: space.sm },
 grid: { position: "absolute", right: 0, borderTopWidth: 1, borderColor: "#F0ECF4" },
 baseline: { borderColor: "#E6E0EC" },
 axis: { position: "absolute", top: -8, textAlign: "right" },
 plot: { flexDirection: "row", alignItems: "flex-end" },
 column: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "flex-end", gap: 2 },
 value: { color: colors.text, textAlign: "center" },
 bar: { width: 14, backgroundColor: colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
 labels: { flexDirection: "row", paddingTop: 4 },
 labelCell: { flex: 1, minWidth: 0, overflow: "visible" },
 monthLabel: { position: "absolute", width: 48, left: "50%", marginLeft: -24, textAlign: "center" },
 center: { textAlign: "center" },
 columns: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm },
 dayColumn: { minHeight: 44, alignItems: "center", gap: 4 },
 dayPlot: { height: PLOT, width: "100%", justifyContent: "flex-end", alignItems: "center", borderBottomWidth: 1, borderColor: "#E6E0EC" },
});
