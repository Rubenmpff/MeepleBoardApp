/**
 * One published experience: author, the rating if they chose to show it, the comment if they published one, the
 * photos they chose (at most 3) and mode · players · month. Never the match, the other participants or the place. Used on the game page, the full
 * list and as the preview before publishing.
 */
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatMonthYear } from "@/src/ui/format";
import { useTranslation } from "react-i18next";
import { Glyph } from "@/src/ui/components";
import JournalPhoto from "@/src/features/games/journal/components/JournalPhoto";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { Experience } from "../types/Experience";

export type CardData = Pick<Experience, "authorName" | "rating" | "comment" | "mode" | "players" | "month" | "edited" | "isMine" | "photos">;

export function monthLabel(month: string, language: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return formatMonthYear(new Date(y, m - 1, 1), language, "short");
}

export default function ExperienceCard({ item, preview, onMore, metaText, onPhoto }: { item: CardData; preview?: boolean; onMore?: () => void; metaText?: string; onPhoto?: (url: string) => void }) {
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
    {!!item.photos?.length && <View style={styles.photos}>
      {item.photos.map(url => onPhoto
        ? <TouchableOpacity key={url} accessibilityRole="imagebutton" accessibilityLabel={t("experiences.openPhoto", { name: item.authorName })} onPress={() => onPhoto(url)}>
          <JournalPhoto uri={url} style={styles.photo} />
        </TouchableOpacity>
        : <JournalPhoto key={url} uri={url} style={styles.photo} />)}
    </View>}
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
  photos: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  photo: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.line },
});
