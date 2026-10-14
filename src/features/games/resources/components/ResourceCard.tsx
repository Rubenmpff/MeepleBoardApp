import { useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { languageName, sourceLine, thumbnailFor } from "./ResourceRow";
import { GameResource } from "../types/GameResource";

// A resource shown by its image: a video (16:9, play mark) or a 3D model (4:3, grid of two).
// The image comes from the original site; without one, a neutral tile. «…» holds the other actions.
export default function ResourceCard({ resource, shape, onMenu }: { resource: GameResource; shape: "video" | "model"; onMenu: (resource: GameResource) => void }) {
  const { t } = useTranslation("games");
  const [failed, setFailed] = useState(false);
  const uri = thumbnailFor(resource);
  const source = sourceLine(resource.author, resource.platform);
  const meta = [shape === "video" ? source : resource.author ?? resource.platform, resource.language ? languageName(t, resource.language) : null,
    resource.isFree == null ? null : t(resource.isFree ? "resources.free" : "resources.paid")].filter(Boolean).join(" · ");
  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="link" accessibilityLabel={[resource.title, source, resource.isOfficial ? t("resources.official") : null, resource.language ? languageName(t, resource.language) : null,
      resource.isFree == null ? null : t(resource.isFree ? "resources.free" : "resources.paid"), resource.compatibility].filter(Boolean).join(", ")}
      accessibilityHint={t("resources.opens", { platform: resource.platform })} onPress={() => { void Linking.openURL(resource.url); }} style={styles.main}>
      <View style={[styles.image, { aspectRatio: shape === "video" ? 16 / 9 : 4 / 3 }]} accessible={false}>
        {uri && !failed ? <Image source={{ uri }} style={styles.fill} resizeMode="cover" onError={() => setFailed(true)} accessible={false} />
          : <Glyph name={shape === "video" ? "play-circle-outline" : "printer-3d"} size={32} color={colors.icon} />}
        {shape === "video" && uri && !failed && <View style={styles.play}><Glyph name="play" size={20} color={colors.onPrimary} /></View>}
      </View>
      <Text style={[type.body, strong]} numberOfLines={2}>{resource.title}</Text>
      <Text style={type.caption} numberOfLines={2}>{meta}</Text>
      {!!resource.compatibility && <Text style={type.micro} numberOfLines={2}>{t("resources.fits", { value: resource.compatibility })}</Text>}
    </TouchableOpacity>
    <TouchableOpacity style={styles.menu} accessibilityRole="button" accessibilityLabel={t("resources.moreFor", { title: resource.title })} onPress={() => onMenu(resource)}>
      <View style={styles.menuDot}><Glyph name="dots-horizontal" size={18} color={colors.text} /></View>
    </TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0 },
  main: { gap: 2 },
  image: { width: "100%", borderRadius: radius.card, borderCurve: "continuous", backgroundColor: colors.hero, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: space.sm },
  fill: { width: "100%", height: "100%" },
  play: { position: "absolute", left: 10, bottom: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(20,14,26,0.66)", alignItems: "center", justifyContent: "center" },
  menu: { position: "absolute", top: 0, right: 0, width: touch, height: touch, alignItems: "center", justifyContent: "center" },
  menuDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
});
