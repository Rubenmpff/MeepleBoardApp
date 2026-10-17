/**
 * The result question of the registration, by mode. Competitive: winners, tie for 1st, or not set — the scores
 * never decide. Cooperative: the team result, for everyone. Solo: «Ganhei / Perdi / Empate / Não definido».
 */
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { MatchOutcome } from "../types/MatchForm";

type Props = { kind: "competitive" | "cooperative" | "solo"; value: MatchOutcome; onChange: (value: MatchOutcome) => void };

export default function ResultChoices({ kind, value, onChange }: Props) {
  const { t } = useTranslation("matches");
  const choice = (key: MatchOutcome, title: string, subtitle?: string, compact = false) => {
    const on = value === key;
    return <TouchableOpacity key={key} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={() => onChange(key)} style={[styles.choice, compact && styles.compact, on && styles.on]}>
      <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.dot} />}</View>
      <View style={styles.flex}>
        <Text style={[type.body, strong]}>{title}</Text>
        {!!subtitle && <Text style={type.caption}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>;
  };
  if (kind === "competitive") return <View style={styles.wrap}>
    <Text style={type.head}>{t("result.who")}</Text>
    <View style={styles.list}>
      {choice("Win", t("result.pick"), t("result.pickSub"))}
      {choice("Draw", t("result.tie"), t("result.tieSub"))}
      {choice("Undefined", t("result.undefined"), t("result.undefinedSub"))}
    </View>
  </View>;
  const labels: [MatchOutcome, string][] = kind === "solo"
    ? [["Win", t("result.iWon")], ["Loss", t("result.iLost")], ["Draw", t("result.draw")], ["Undefined", t("result.undefined")]]
    : [["Win", t("result.weWon")], ["Loss", t("result.weLost")], ["Draw", t("result.draw")], ["Undefined", t("result.undefined")]];
  return <View style={styles.wrap}>
    <Text style={type.head}>{t(kind === "solo" ? "result.title" : "result.team")}</Text>
    <View style={styles.grid}>{labels.map(([key, label]) => choice(key, label, undefined, true))}</View>
    <Text style={type.caption}>{t(kind === "solo" ? "result.soloNote" : "result.teamNote")}</Text>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  list: { gap: space.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  choice: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 56, paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card },
  compact: { flexGrow: 1, flexBasis: "45%", minHeight: touch + 8 },
  on: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.empty, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  flex: { flex: 1, minWidth: 0 },
});
