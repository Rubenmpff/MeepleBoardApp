import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Glyph } from "@/src/ui/components";
import { colors, space, strong, touch, type } from "@/src/ui/theme";
import { GameResource } from "../types/GameResource";

// One link: the row opens the original page; the trailing button reports a problem.
export default function ResourceRow({ resource, first, onReport }: { resource: GameResource; first?: boolean; onReport?: (resource: GameResource) => void }) {
  const { t } = useTranslation("games");
  const tags = [
    resource.isOfficial ? t("resources.official") : null,
    resource.language ? languageName(t, resource.language) : null,
    resource.isFree == null ? null : t(resource.isFree ? "resources.free" : "resources.paid"),
  ].filter(Boolean) as string[];
  const source = sourceLine(resource.author, resource.platform);
  return <View style={styles.row}>
    {!first && <View style={styles.separator} />}
    <TouchableOpacity style={styles.main} accessibilityRole="link" accessibilityLabel={[resource.title, source, ...tags].join(", ")}
      accessibilityHint={t("resources.opens", { platform: resource.platform })} onPress={() => { void Linking.openURL(resource.url); }}>
      <Text style={[type.body, strong]}>{resource.title}</Text>
      <Text style={type.caption}>{source}</Text>
      {!!resource.compatibility && <Text style={type.caption}>{t("resources.fits", { value: resource.compatibility })}</Text>}
      {tags.length > 0 && <View style={styles.tags}>{tags.map(tag => <Text key={tag} style={[styles.tag, tag === t("resources.official") && styles.official]}>{tag}</Text>)}</View>}
    </TouchableOpacity>
    <View style={styles.side}>
      <Glyph name="open-in-new" size={18} color={colors.primary} />
      {onReport && <TouchableOpacity style={styles.more} accessibilityRole="button" accessibilityLabel={t("resources.reportFor", { title: resource.title })} onPress={() => onReport(resource)}>
        <Glyph name="flag-outline" size={20} color={colors.muted} />
      </TouchableOpacity>}
    </View>
  </View>;
}

// "Author · Platform", once when they are the same (e.g. a publisher's own site).
export function sourceLine(author: string | null, platform: string) {
  return author && author !== platform ? `${author} · ${platform}` : platform;
}

export function languageName(t: (key: string, options?: Record<string, unknown>) => string, code: string | null) {
  return code ? t(`resources.languages.${code}`, { defaultValue: code.toUpperCase() }) : t("resources.languages.none");
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch" },
  separator: { position: "absolute", top: 0, left: space.lg, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.hair },
  main: { flex: 1, minWidth: 0, paddingVertical: space.md, paddingLeft: space.lg, paddingRight: space.sm, gap: 2, minHeight: 56 },
  side: { alignItems: "center", justifyContent: "space-between", paddingVertical: space.sm, paddingRight: space.xs, minWidth: touch },
  more: { minWidth: touch, minHeight: touch, alignItems: "center", justifyContent: "center" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginTop: space.xs },
  tag: { fontSize: 12, lineHeight: 18, fontWeight: "600", color: colors.muted, backgroundColor: colors.track, paddingHorizontal: 8, borderRadius: 999, overflow: "hidden" },
  official: { color: colors.primary, backgroundColor: colors.primarySoft },
});
