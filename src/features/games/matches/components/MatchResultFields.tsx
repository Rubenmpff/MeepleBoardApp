import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
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
  const updateScore = (id: string, score: string) => onChange(players.map(p => p.id === id ? { ...p, score } : p));
  return <View style={{ gap: 12 }}>
    <View style={styles.options}>
      {[false, true].map(enabled => <TouchableOpacity key={String(enabled)} accessibilityRole="radio"
        accessibilityState={{ selected: scoresEnabled === enabled }} onPress={() => onScoresEnabled(enabled)}
        style={[styles.option, scoresEnabled === enabled && styles.active]}>
        <Text style={[styles.optionText, scoresEnabled === enabled && { color: COLORS.primary }]}>{t(enabled ? "form.withScores" : "form.withoutScores")}</Text>
      </TouchableOpacity>)}
    </View>
    <Text style={styles.hint}>{t(competitive ? "form.winnerHelp" : "form.modeLimitations")}</Text>
    {scoresEnabled && <Text style={styles.hint}>{t("form.scoreHelp")}</Text>}
    {players.map(p => {
      const error = scoresEnabled ? scoreError(p.score) : undefined;
      const visibleError = error && (showErrors || !!p.score?.trim());
      return <View key={p.id} style={styles.player}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{p.username || t("sessions.playerNameUnavailable")}</Text>
          {competitive && <TouchableOpacity accessibilityRole="radio"
            accessibilityLabel={t("selector.winnerFor", { name: p.username })} accessibilityState={{ selected: p.isWinner }}
            onPress={() => onChange(players.map(player => ({ ...player, isWinner: player.id === p.id })))}
            style={[styles.winner, p.isWinner && styles.active]}>
            <MaterialIcons name={p.isWinner ? "emoji-events" : "radio-button-unchecked"} size={20} color={p.isWinner ? COLORS.primary : COLORS.textMuted} />
            <Text style={styles.winnerText}>{t(p.isWinner ? "selector.winner" : "selector.setWinner")}</Text>
          </TouchableOpacity>}
        </View>
        {scoresEnabled && <View style={{ gap: 6 }}>
          <Text style={styles.label}>{t("form.scoreFor", { name: p.username })}</Text>
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
          {visibleError && <Text accessibilityLiveRegion="polite" style={styles.error}>{t(error === "required" ? "form.scoreRequired" : "form.scoreInvalid")}</Text>}
        </View>}
      </View>;
    })}
    {competitive && showErrors && !players.some(p => p.isWinner) && <Text accessibilityLiveRegion="polite" style={styles.error}>{t("validation.selectWinner")}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { ...UI_STYLES.control, padding: 12, borderWidth: 1, borderColor: COLORS.border, flexGrow: 1, alignItems: "center" },
  optionText: { ...UI_STYLES.body, fontWeight: "700" },
  active: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  hint: { ...UI_STYLES.caption, color: COLORS.textMuted },
  player: { gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  nameRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  name: { ...UI_STYLES.body, fontWeight: "700", flexGrow: 1, flexShrink: 1 },
  winner: { ...UI_STYLES.control, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  winnerText: { ...UI_STYLES.caption, color: COLORS.primary, fontWeight: "700", flexShrink: 1 },
  label: { ...UI_STYLES.caption, color: COLORS.textMuted },
  scoreRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  sign: { ...UI_STYLES.control, minWidth: 52, padding: 10, backgroundColor: COLORS.primarySoft, alignItems: "center" },
  signText: { fontSize: 22, color: COLORS.primary, fontWeight: "700" },
  input: { ...UI_STYLES.field, flex: 1, minWidth: 0, fontWeight: "700" },
  error: { ...UI_STYLES.caption, color: COLORS.error },
});
