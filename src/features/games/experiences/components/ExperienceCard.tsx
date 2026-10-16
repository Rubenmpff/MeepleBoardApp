/**
 * One published experience: author, the rating if they chose to show it, the comment if they published one, and
 * mode · players · month. Never the match, the other participants or the place. Used on the game page, the full
 * list and as the preview before publishing.
 */
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { Experience } from "../types/Experience";

export type CardData = Pick<Experience, "authorName" | "rating" | "comment" | "mode" | "players" | "month" | "edited" | "isMine">;

export function monthLabel(month: string, language: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  // «out. 2026»: composed from parts so every engine shows the short month name.
  return `${new Intl.DateTimeFormat(language === "pt" ? "pt-PT" : "en-GB", { month: "short" }).format(new Date(y, m - 1, 1))} ${y}`;
}

export default function ExperienceCard({ item, preview, onMore, metaText }: { item: CardData; preview?: boolean; onMore?: () => void; metaText?: string }) {
  const { t, i18n } = useTranslation("games");
  const rating = item.rating == null ? null : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(item.rating);
  const meta = metaText ?? [t(`experiences.modes.${item.mode}`), t("experiences.players", { count: item.players }), monthLabel(item.month, i18n.language), item.edited ? t("experiences.edited") : null].filter(Boolean).join(" · ");
  const initial = item.authorName.replace(/^Teste-/, "")[0]?.toUpperCase() ?? "?";
  return <View style={[styles.card, preview && styles.preview]} accessible={!onMore}
    accessibilityLabel={[item.authorName, rating ? t("experiences.ratingLabel", { value: rating }) : null, item.comment, meta].filter(Boolean).join(". ")}>
    <View style={styles.head}>
      <View style={styles.avatar}><Text style={styles.initial}>{initial}</Text></View>
      <View style={styles.flex}><Text style={[type.body, strong]} numberOfLines={2}>{item.authorName}{item.isMine ? <Text style={styles.yours}>{"  " + t("experiences.yours")}</Text> : null}</Text></View>
      {rating != null && <View style={styles.rate}><Text style={styles.rateValue}>{rating}</Text><Text style={styles.rateScale}>/10</Text></View>}
      {onMore && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("experiences.more")} onPress={onMore} style={styles.more}>
        <Glyph name="dots-horizontal" size={20} color={colors.muted} />
      </TouchableOpacity>}
    </View>
    {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
    <Text style={type.caption}>{meta}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  preview: { borderStyle: "dashed", backgroundColor: colors.band },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#EEE6F8", alignItems: "center", justifyContent: "center" },
  initial: { ...type.body, ...strong, color: colors.friend },
  flex: { flex: 1, minWidth: 0 },
  yours: { ...type.micro, ...strong, color: colors.primary },
  rate: { flexDirection: "row", alignItems: "baseline", backgroundColor: colors.pendingSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  rateValue: { ...type.body, fontWeight: "800", color: colors.pendingText, fontVariant: ["tabular-nums"] },
  rateScale: { ...type.micro, color: colors.pendingText },
  more: { minWidth: touch, minHeight: touch, alignItems: "center", justifyContent: "center", marginRight: -space.sm },
  comment: { ...type.body, lineHeight: 22 },
});
