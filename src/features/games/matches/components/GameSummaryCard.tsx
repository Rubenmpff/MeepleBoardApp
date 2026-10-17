/** The chosen game at the top of every registration step: cover, name, «year · Jogo base/Expansão · mode», «Mudar». */
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import GameCover from "@/src/ui/GameCover";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { Game } from "../../catalog/types/Game";

type Props = { game: Game; modeLabel?: string; onChange?: () => void };

export default function GameSummaryCard({ game, modeLabel, onChange }: Props) {
  const { t } = useTranslation("matches");
  const meta = [game.yearPublished ? String(game.yearPublished) : null, t(game.isExpansion ? "picker.expansion" : "picker.baseGame"), modeLabel ?? null].filter(Boolean).join(" · ");
  return <View style={styles.card}>
    <GameCover uri={game.imageUrl} size={52} />
    <View style={styles.flex}>
      <Text style={[type.body, strong]} numberOfLines={3}>{game.name}</Text>
      <Text style={type.caption}>{meta}</Text>
    </View>
    {onChange && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("game.changeGame")} onPress={onChange} style={styles.link}>
      <Text style={styles.linkText}>{t("game.change")}</Text>
    </TouchableOpacity>}
  </View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line },
  flex: { flex: 1, minWidth: 0 },
  link: { minHeight: touch, minWidth: touch, justifyContent: "center", alignItems: "flex-end" },
  linkText: { ...type.body, ...strong, color: colors.primary },
});
