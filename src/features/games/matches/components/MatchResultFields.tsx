/**
 * The result table of the registration: one row per player with points (when scores are on), the selection
 * column (winner, or tied for 1st) and the result each player gets. Scores are recorded but never decide who
 * wins. With large text, or a name too long to sit beside points, selection and result, the name takes its own line. On iOS the number pad gets a bar with «±» and «Concluir».
 */
import { useState } from "react";
import { InputAccessoryView, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph, Segmented } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { PlayerState } from "../../../users/types/PlayerState";
import { MatchOutcome } from "../types/MatchForm";
import { scoreError, toggleScoreSign } from "../utils/registrationScores";

type Props = {
  players: PlayerState[];
  onChange: (players: PlayerState[]) => void;
  scoresEnabled: boolean;
  onScoresEnabled: (enabled: boolean) => void;
  /** Selection column: winners, players tied for 1st, or none (team, solo or undefined results). */
  selection: "winner" | "tied" | null;
  outcomeFor: (id: string) => MatchOutcome;
  showErrors: boolean;
};

const ACCESSORY = "match-score-sign";

export default function MatchResultFields({ players, onChange, scoresEnabled, onScoresEnabled, selection, outcomeFor, showErrors }: Props) {
  const { t } = useTranslation("matches");
  const { width, fontScale } = useWindowDimensions();
  const longest = Math.max(0, ...players.map(p => (p.username ?? "").length));
  const large = width < 360 || fontScale > 1.3 || (scoresEnabled && !!selection && longest * 8.5 > width - 290);
  const [focused, setFocused] = useState<string | null>(null);
  const updateScore = (id: string, score: string) => onChange(players.map(p => p.id === id ? { ...p, score } : p));
  const toggle = (id: string) => onChange(players.map(p => p.id === id ? { ...p, isWinner: !p.isWinner } : p));
  const outcomeText = (o: MatchOutcome) => o === "Win" ? t("result.win") : o === "Loss" ? t("result.loss") : o === "Draw" ? t("result.draw") : "—";

  const scoreCell = (p: PlayerState) => {
    const error = scoreError(p.score);
    const visibleError = !!error && (showErrors || !!p.score?.trim());
    return <TextInput style={[styles.score, large && styles.scoreLarge, visibleError && { borderColor: colors.danger }]}
      accessibilityLabel={t("form.scoreFor", { name: p.username })} value={p.score ?? ""} onChangeText={value => updateScore(p.id, value)}
      keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.placeholder} autoCorrect={false} selectTextOnFocus returnKeyType="done"
      inputAccessoryViewID={Platform.OS === "ios" ? ACCESSORY : undefined} onFocus={() => setFocused(p.id)} />;
  };
  const selectCell = (p: PlayerState) => selection && <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: p.isWinner }}
    accessibilityLabel={t(selection === "tied" ? "outcomes.drawFor" : "selector.winnerFor", { name: p.username })}
    onPress={() => toggle(p.id)} style={styles.selectTouch}>
    <View style={[styles.check, p.isWinner && (selection === "tied" ? styles.checkTied : styles.checkOn)]}>
      {p.isWinner && <Glyph name="check" size={18} color="#FFFFFF" />}
    </View>
  </TouchableOpacity>;
  const outcomeCell = (p: PlayerState) => { const o = outcomeFor(p.id);
    return <Text style={[styles.outcome, o === "Win" && styles.win, o === "Loss" && styles.loss, o === "Draw" && styles.draw]}>{outcomeText(o)}</Text>; };

  return <View style={styles.wrap}>
    <Segmented role="button" items={[{ key: "off", label: t("form.withoutScores") }, { key: "on", label: t("form.withScores") }]}
      value={scoresEnabled ? "on" : "off"} onChange={key => onScoresEnabled(key === "on")} />
    <View style={styles.table}>
      {!large && <View style={[styles.row, styles.head]}>
        <Text style={[styles.th, styles.nameCol]}>{t("result.player")}</Text>
        {scoresEnabled && <Text style={[styles.th, styles.scoreCol, styles.right]}>{t("form.points")}</Text>}
        {selection && <Text style={[styles.th, styles.selectCol, styles.centerText]}>{t(selection === "tied" ? "result.tied" : "result.winner")}</Text>}
        <Text style={[styles.th, styles.outcomeCol, styles.right]}>{t("result.title")}</Text>
      </View>}
      {players.map((p, i) => {
        const error = scoresEnabled ? scoreError(p.score) : undefined;
        const visibleError = !!error && (showErrors || !!p.score?.trim());
        return <View key={p.id} style={[styles.player, i > 0 && styles.divider]}>
          {large ? <>
            <Text style={styles.name}>{p.username || t("sessions.playerNameUnavailable")}</Text>
            <View style={styles.row}>
              {scoresEnabled && <View style={styles.flex}>{scoreCell(p)}</View>}
              {selectCell(p)}
              <View style={[styles.flex, styles.alignEnd]}>{outcomeCell(p)}</View>
            </View>
          </> : <View style={styles.row}>
            <Text style={[styles.name, styles.nameCol]}>{p.username || t("sessions.playerNameUnavailable")}</Text>
            {scoresEnabled && <View style={styles.scoreCol}>{scoreCell(p)}</View>}
            {selection && <View style={[styles.selectCol, styles.alignCenter]}>{selectCell(p)}</View>}
            <View style={[styles.outcomeCol, styles.alignEnd]}>{outcomeCell(p)}</View>
          </View>}
          {visibleError && <Text accessibilityLiveRegion="polite" style={styles.error}>{t(error === "required" ? "form.scoreRequired" : "form.scoreInvalid")}</Text>}
        </View>;
      })}
    </View>
    {Platform.OS === "ios" && <InputAccessoryView nativeID={ACCESSORY}>
      <View style={styles.accessory}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("form.toggleSign", { name: players.find(p => p.id === focused)?.username ?? "" })}
          onPress={() => focused && updateScore(focused, toggleScoreSign(players.find(p => p.id === focused)?.score))} style={styles.accessoryButton}>
          <Text style={styles.accessoryText}>±</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => Keyboard.dismiss()} style={styles.accessoryButton}>
          <Text style={styles.accessoryText}>{t("form.done")}</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  table: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  head: { backgroundColor: colors.tint, paddingVertical: space.sm },
  th: { ...type.micro, ...strong, letterSpacing: 0.3, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.md },
  player: { paddingVertical: space.sm, gap: space.xs },
  divider: { borderTopWidth: 1, borderTopColor: colors.hair },
  nameCol: { flex: 1, minWidth: 0 },
  scoreCol: { width: 78 },
  selectCol: { width: 72 },
  outcomeCol: { width: 84 },
  name: { ...type.body, ...strong, paddingHorizontal: 0 },
  right: { textAlign: "right" },
  centerText: { textAlign: "center" },
  alignCenter: { alignItems: "center" },
  alignEnd: { alignItems: "flex-end" },
  flex: { flex: 1 },
  score: { minHeight: touch, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background, paddingHorizontal: space.sm,
    fontSize: 16, fontWeight: "700", color: colors.text, textAlign: "right", fontVariant: ["tabular-nums"] },
  scoreLarge: { minWidth: 92 },
  selectTouch: { minWidth: touch, minHeight: touch, alignItems: "center", justifyContent: "center" },
  check: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkTied: { backgroundColor: colors.gold, borderColor: colors.gold },
  outcome: { ...type.caption, ...strong },
  win: { color: colors.primary },
  loss: { color: "#A3445A" },
  draw: { color: colors.pendingText },
  error: { ...type.caption, color: colors.danger, paddingHorizontal: space.md },
  accessory: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.tint, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: space.sm },
  accessoryButton: { minHeight: touch, minWidth: 64, alignItems: "center", justifyContent: "center" },
  accessoryText: { ...type.body, ...strong, color: colors.primary },
});
