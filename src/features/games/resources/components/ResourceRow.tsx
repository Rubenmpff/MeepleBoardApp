import { useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph, type Icon } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { GameResource, ResourceKind } from "../types/GameResource";

const KIND_ICON: Record<ResourceKind, Icon> = {
  Rules: "book-open-variant", HowToPlay: "play-circle-outline", Playthrough: "play-box-multiple-outline",
  PrintModel: "printer-3d", Unboxing: "package-variant", Material: "file-document-outline",
};
const VIDEO: ResourceKind[] = ["HowToPlay", "Playthrough", "Unboxing"];

// One link: title and image first; source, language, price and compatibility underneath.
// Tapping opens the original page; «…» holds the other actions (report a problem).
export default function ResourceRow({ resource, first, onMenu }: { resource: GameResource; first?: boolean; onMenu?: (resource: GameResource) => void }) {
  const { t } = useTranslation("games");
  const source = sourceLine(resource.author, resource.platform);
  const meta = [
    resource.isOfficial ? t("resources.official") : null,
    resource.language ? languageName(t, resource.language) : null,
    resource.isFree == null ? null : t(resource.isFree ? "resources.free" : "resources.paid"),
  ].filter(Boolean) as string[];
  return <View style={styles.row}>
    {!first && <View style={styles.separator} />}
    <TouchableOpacity style={styles.main} accessibilityRole="link" accessibilityLabel={[resource.title, source, ...meta, resource.compatibility].filter(Boolean).join(", ")}
      accessibilityHint={t("resources.opens", { platform: resource.platform })} onPress={() => { void Linking.openURL(resource.url); }}>
      <Thumbnail resource={resource} />
      <View style={styles.text}>
        <Text style={[type.body, strong]} numberOfLines={3}>{resource.title}</Text>
        <Text style={type.caption} numberOfLines={2}>{source}</Text>
        {meta.length > 0 && <Text style={type.micro}>{meta.join(" · ")}</Text>}
        {!!resource.compatibility && <Text style={type.micro} numberOfLines={2}>{t("resources.fits", { value: resource.compatibility })}</Text>}
      </View>
    </TouchableOpacity>
    {onMenu && <TouchableOpacity style={styles.menu} accessibilityRole="button" accessibilityLabel={t("resources.moreFor", { title: resource.title })} onPress={() => onMenu(resource)}>
      <Glyph name="dots-horizontal" size={22} color={colors.muted} />
    </TouchableOpacity>}
  </View>;
}

// The original site's image when there is one; YouTube's own thumbnail for its videos; otherwise a neutral tile.
function Thumbnail({ resource }: { resource: GameResource }) {
  const [failed, setFailed] = useState(false);
  const uri = thumbnailFor(resource);
  return <View style={styles.thumb} accessible={false}>
    {uri && !failed ? <Image source={{ uri }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} accessible={false} />
      : <Glyph name={KIND_ICON[resource.kind]} size={28} color={colors.icon} />}
    {uri && !failed && VIDEO.includes(resource.kind) && <View style={styles.play}><Glyph name="play" size={16} color={colors.onPrimary} /></View>}
  </View>;
}

export function thumbnailFor(resource: GameResource): string | null {
  if (resource.thumbnailUrl) return resource.thumbnailUrl;
  const video = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/.exec(resource.url)?.[1];
  return video ? `https://i.ytimg.com/vi/${video}/hqdefault.jpg` : null;
}

// "Author · Platform", once when they are the same (e.g. a publisher's own site).
export function sourceLine(author: string | null, platform: string) {
  return author && author !== platform ? `${author} · ${platform}` : platform;
}

export function languageName(t: (key: string, options?: Record<string, unknown>) => string, code: string | null) {
  return code ? t(`resources.languages.${code}`, { defaultValue: code.toUpperCase() }) : t("resources.languages.none");
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  separator: { position: "absolute", top: 0, left: space.lg, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.hair },
  main: { flex: 1, minWidth: 0, flexDirection: "row", gap: space.md, paddingVertical: space.md, paddingLeft: space.md, minHeight: touch },
  thumb: { width: 96, height: 72, borderRadius: radius.control - 4, backgroundColor: colors.hero, alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  image: { width: "100%", height: "100%" },
  play: { position: "absolute", right: 6, bottom: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(35,25,45,0.62)", alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
  menu: { minWidth: touch, minHeight: touch, marginTop: space.xs, alignItems: "center", justifyContent: "center" },
});
