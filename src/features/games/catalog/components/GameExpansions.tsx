/**
 * Expansions of this game in the MeepleBoard catalogue, each with your library state («Tenho», «Quero», «Já joguei»)
 * and a way to its own page. Only shown when the catalogue knows at least one expansion.
 */
import { Image, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Glyph, Row, Section } from "@/src/ui/components";
import { colors, radius, type } from "@/src/ui/theme";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { Game } from "../types/Game";

type Props = { expansions: Game[]; statusOf: (gameId: string) => GameLibraryStatus | undefined; onOpen: (gameId: string) => void };

export default function GameExpansions({ expansions, statusOf, onOpen }: Props) {
  const { t } = useTranslation("games");
  const { t: libraryT } = useTranslation("library");
  if (!expansions.length) return null;
  const label = (status?: GameLibraryStatus) => status === GameLibraryStatus.Owned ? libraryT("ui.owned") : status === GameLibraryStatus.Wishlist ? libraryT("ui.wanted")
    : status === GameLibraryStatus.Played ? libraryT("ui.played") : null;
  const owned = expansions.filter(e => statusOf(e.id) === GameLibraryStatus.Owned).length;
  const sorted = [...expansions].sort((a, b) => (a.yearPublished ?? 9999) - (b.yearPublished ?? 9999) || a.name.localeCompare(b.name));
  return <Section title={t("details.expansions.title")} note={t("details.expansions.owned", { owned, total: expansions.length })}>
    <Card>
      {sorted.map((e, i) => {
        const status = label(statusOf(e.id));
        const subtitle = [t("details.expansions.item"), e.yearPublished ? String(e.yearPublished) : null].filter(Boolean).join(" · ");
        return <Row key={e.id} first={i === 0} inset={68} title={e.name} strongTitle subtitle={subtitle} accessibilityLabel={[e.name, subtitle, status].filter(Boolean).join(", ")}
          accessibilityHint={t("details.expansions.open")} onPress={() => onOpen(e.id)}
          lead={<View style={styles.thumb}>{e.imageUrl ? <Image source={{ uri: e.imageUrl }} style={styles.image} resizeMode="cover" accessible={false} /> : <Glyph name="layers-outline" size={22} color={colors.icon} />}</View>}
          detail={status ? <View style={[styles.badge, statusOf(e.id) !== GameLibraryStatus.Owned && styles.badgeOther]}>
            {statusOf(e.id) === GameLibraryStatus.Owned && <Glyph name="check" size={12} color={colors.primary} />}
            <Text style={[styles.badgeText, statusOf(e.id) !== GameLibraryStatus.Owned && { color: colors.muted }]}>{status}</Text>
          </View> : undefined} />;
      })}
    </Card>
  </Section>;
}

const styles = StyleSheet.create({
  thumb: { width: 40, height: 40, borderRadius: radius.control - 2, backgroundColor: "#EEE6F8", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.primarySoft },
  badgeOther: { backgroundColor: colors.track },
  badgeText: { ...type.micro, fontWeight: "700", color: colors.primary },
});
