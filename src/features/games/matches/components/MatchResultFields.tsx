import { View, Text, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { PlayerState } from "../../../users/types/PlayerState";
import { scoreError, toggleScoreSign } from "../utils/registrationScores";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

type Props = {
  players: PlayerState[];
  onChange: (players: PlayerState[]) => void;
  scoresEnabled: boolean;
  onScoresEnabled: (enabled: boolean) => void;
  competitive: boolean;
  showErrors: boolean;
};

export default function MatchResultFields({ players, onChange, scoresEnabled, onScoresEnabled, competitive, showErrors }: Props) {
  const { t } = useTranslation("matches");
  const { width, fontScale } = useWindowDimensions();
  const expanded = width < 360 || fontScale > 1.3;
  const updateScore = (id: string, score: string) => onChange(players.map(p => p.id === id ? { ...p, score } : p));
  const winnerControl = (p: PlayerState) => competitive && <TouchableOpacity accessibilityRole="radio"
    accessibilityLabel={t("selector.winnerFor", { name: p.username })} accessibilityState={{ selected: p.isWinner }}
    onPress={() => onChange(players.map(player => ({ ...player, isWinner: player.id === p.id })))}
    style={[styles.winner, p.isWinner && styles.active]}>
    <MaterialIcons name={p.isWinner ? "radio-button-checked" : "radio-button-unchecked"} size={24} color={p.isWinner ? COLORS.primary : COLORS.textMuted} />
  </TouchableOpacity>;

  return <View style={{ gap: 8 }}>
    <View style={styles.options}>
      {[false, true].map(enabled => <TouchableOpacity key={String(enabled)} accessibilityRole="radio"
        accessibilityState={{ selected: scoresEnabled === enabled }} onPress={() => onScoresEnabled(enabled)}
        style={[styles.option, scoresEnabled === enabled && styles.active]}>
        <Text style={[styles.optionText, scoresEnabled === enabled && { color: COLORS.primary }]}>{t(enabled ? "form.withScores" : "form.withoutScores")}</Text>
      </TouchableOpacity>)}
    </View>
    <Text style={styles.hint}>{t(competitive ? "form.winnerHelp" : "form.modeLimitations")}</Text>
    {scoresEnabled && <Text style={styles.hint}>{t("form.scoreHelp")}</Text>}
    {competitive && <Text style={styles.columnLabel}>{t("form.winnerColumn")}</Text>}
    {players.map(p => {
      const error = scoresEnabled ? scoreError(p.score) : undefined;
      const visibleError = error && (showErrors || !!p.score?.trim());
      return <View key={p.id} style={[styles.player, p.isWinner && competitive && styles.selectedPlayer]}>
        <View style={[styles.playerRow, expanded && styles.expandedRow]}>
          <View style={[styles.nameRow, expanded && styles.expandedNameRow]}>
            <Text style={styles.name}>{p.username || t("sessions.playerNameUnavailable")}</Text>
            {expanded && winnerControl(p)}
          </View>
          {scoresEnabled && <View style={[styles.scoreBlock, expanded && styles.expandedScore]}>
            <Text style={styles.label}>{t("form.points")}</Text>
            <View style={styles.scoreRow}>
              <TouchableOpacity style={styles.sign} accessibilityRole="button" accessibilityLabel={t("form.toggleSign", { name: p.username })}
                onPress={() => updateScore(p.id, toggleScoreSign(p.score))}>
                <Text style={styles.signText}>±</Text>
              </TouchableOpacity>
              <TextInput style={[styles.input, visibleError && { borderColor: COLORS.error }]}
                accessibilityLabel={t("form.scoreFor", { name: p.username })}
                value={p.score ?? ""} onChangeText={value => updateScore(p.id, value)}
                keyboardType="number-pad" placeholder="—" placeholderTextColor={COLORS.textMuted}
                autoCorrect={false} selectTextOnFocus returnKeyType="done" />
            </View>
          </View>}
          {!expanded && winnerControl(p)}
        </View>
        {visibleError && <Text accessibilityLiveRegion="polite" style={styles.error}>{t(error === "required" ? "form.scoreRequired" : "form.scoreInvalid")}</Text>}
      </View>;
    })}
    {competitive && showErrors && !players.some(p => p.isWinner) && <Text accessibilityLiveRegion="polite" style={styles.error}>{t("validation.selectWinner")}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { ...UI_STYLES.control, padding: 10, borderWidth: 1, borderColor: COLORS.border, flexGrow: 1, alignItems: "center" },
  optionText: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.onBackground },
  active: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  hint: { ...UI_STYLES.caption, color: COLORS.textMuted },
  columnLabel: { ...UI_STYLES.caption, color: COLORS.onBackground, fontWeight: "700", textAlign: "right" },
  player: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 4 },
  selectedPlayer: { borderBottomColor: COLORS.primary },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  expandedRow: { flexDirection: "column", alignItems: "stretch" },
  nameRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  expandedNameRow: { flex: 0, width: "100%" },
  name: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", flex: 1, minWidth: 0 },
  winner: { width: 44, minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  label: { ...UI_STYLES.caption, color: COLORS.textMuted },
  scoreBlock: { width: 132, gap: 2 },
  expandedScore: { width: "100%" },
  scoreRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  sign: { ...UI_STYLES.control, minWidth: 44, paddingHorizontal: 8, backgroundColor: COLORS.primarySoft, alignItems: "center" },
  signText: { fontSize: 22, color: COLORS.primary, fontWeight: "700" },
  input: { ...UI_STYLES.field, minHeight: 44, paddingHorizontal: 8, paddingVertical: 8, flex: 1, minWidth: 0, fontWeight: "700", textAlign: "right" },
  error: { ...UI_STYLES.caption, color: COLORS.error },
});
