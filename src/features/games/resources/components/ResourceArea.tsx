/**
 * «Como jogar» or «Recursos» on the game page. Resources of the base game first, then one group per expansion;
 * inside each, only the kinds (and 3D categories) that have something. Videos and 3D models are shown by their
 * image (the first base-game video large, 3D models in a grid); what is missing fits in one quiet line.
 * The language is one button; choosing it never changes the app language. When it has nothing, one notice offers the others.
 */
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenState from "@/src/ui/ScreenState";
import Sheet from "@/src/ui/Sheet";
import { Button, Card, Glyph, Row } from "@/src/ui/components";
import { colors, isLarge, radius, space, strong, touch, type } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";
import ResourceRow, { languageName } from "./ResourceRow";
import ResourceCard from "./ResourceCard";
import ResourceActionsSheet from "./ResourceActionsSheet";
import { AREA_KINDS, GameResource, GameResourceList, PRINT_CATEGORIES, ResourceKind } from "../types/GameResource";

type Props = {
  area: keyof typeof AREA_KINDS;
  gameId: string;
  gameName: string;
  data: GameResourceList | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  language: string;
  appLanguage: string;
  onLanguage: (language: string) => void;
  canManage: boolean;
};

const VIDEOS: ResourceKind[] = ["HowToPlay", "Playthrough", "Unboxing"];

export default function ResourceArea({ area, gameId, gameName, data, loading, error, onRetry, language, appLanguage, onLanguage, canManage }: Props) {
  const { t } = useTranslation("games");
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const [menu, setMenu] = useState<GameResource | null>(null);
  const [choosing, setChoosing] = useState(false);
  const kinds = AREA_KINDS[area] as readonly ResourceKind[];

  // The user's language first, then languages that have resources, then «Todos».
  const codes = [...new Set([appLanguage, language, ...(data?.languages ?? []).map(l => l.code)].filter((c): c is string => !!c && c !== "all"))];
  const options = [...codes.map(code => ({ key: code, label: languageName(t, code) })), { key: "all", label: t("resources.language.all") }];
  const current = options.find(o => o.key === language) ?? options[options.length - 1];

  const areaTotal = (data?.languages ?? []).reduce((sum, l) => sum + kinds.reduce((n, k) => n + (l.kinds[k] ?? 0), 0), 0);
  const items = (data?.items ?? []).filter(r => kinds.includes(r.kind));
  // Other languages with something in this area, most first.
  const elsewhere = language === "all" ? [] : (data?.languages ?? [])
    .filter(l => l.code && l.code !== language)
    .map(l => ({ code: l.code!, count: kinds.reduce((n, k) => n + (l.kinds[k] ?? 0), 0) }))
    .filter(l => l.count > 0)
    .sort((a, b) => b.count - a.count);
  const suggest = () => router.push({ pathname: ROUTES.RESOURCE_FORM, params: { gameId, gameName } } as never);
  const manage = () => router.push({ pathname: ROUTES.RESOURCE_ADMIN, params: { gameId, gameName } } as never);
  // Kinds with nothing in any language; those in other languages are offered by «Também em».
  const missing = kinds.filter(k => !items.some(r => r.kind === k) && !(data?.languages ?? []).some(l => (l.kinds[k] ?? 0) > 0))
    .map(k => t(`resources.kindsInline.${k}`));

  // The API lists the base game first, then each expansion; keep that order.
  const groups = [...new Set(items.map(r => r.expansion ?? ""))];
  const rows = (list: GameResource[]) => <Card>{list.map((r, i) => <ResourceRow key={r.id} resource={r} first={i === 0} onMenu={setMenu} />)}</Card>;
  const grid = (list: GameResource[]) => <View style={styles.grid}>
    {Array.from({ length: Math.ceil(list.length / (large ? 1 : 2)) }, (_, row) => list.slice(row * (large ? 1 : 2), (row + 1) * (large ? 1 : 2))).map((pair, i) =>
      <View key={i} style={styles.gridRow}>{pair.map(r => <ResourceCard key={r.id} resource={r} shape="model" onMenu={setMenu} />)}{pair.length === 1 && !large && <View style={styles.gridGap} />}</View>)}
  </View>;
  const heading = (text: string) => <Text style={[type.caption, strong, styles.pad]} accessibilityRole="header">{text}</Text>;
  const kindBlock = (kind: ResourceKind, list: GameResource[], base: boolean) => {
    if (kind === "PrintModel") return <View key={kind} style={styles.block}>
      {heading(t("resources.kinds.PrintModel"))}
      {PRINT_CATEGORIES.filter(c => list.some(r => r.printCategory === c)).map(c => <View key={c} style={styles.category}>
        <Text style={[type.micro, styles.pad]}>{t(`resources.categories.${c}`)}</Text>
        {grid(list.filter(r => r.printCategory === c))}
      </View>)}
    </View>;
    // The base game's first video is shown large; the rest, and expansions, as compact rows.
    if (VIDEOS.includes(kind) && base) return <View key={kind} style={styles.block}>
      {heading(t(`resources.kinds.${kind}`))}
      <ResourceCard resource={list[0]} shape="video" onMenu={setMenu} />
      {list.length > 1 && rows(list.slice(1))}
    </View>;
    return <View key={kind} style={styles.block}>{heading(t(`resources.kinds.${kind}`))}{rows(list)}</View>;
  };

  const suggestRow = <TouchableOpacity style={styles.suggest} onPress={suggest} accessibilityRole="button" accessibilityLabel={t("resources.suggest")} accessibilityHint={t("resources.suggestHint")}>
    <Glyph name="plus" size={18} color={colors.primary} />
    <Text style={[type.body, strong, { color: colors.primary }]}>{t("resources.suggest")}</Text>
  </TouchableOpacity>;

  return <View style={styles.area}>
    <View style={styles.language}>
      <Text style={type.caption}>{t("resources.language.button")}</Text>
      <TouchableOpacity style={styles.languageButton} onPress={() => setChoosing(true)} accessibilityRole="button" accessibilityLabel={`${t("resources.language.button")}: ${current.label}`}
        accessibilityHint={t("resources.language.sheetNote")}>
        <Glyph name="translate" size={16} color={colors.primary} />
        <Text style={[type.body, strong]}>{current.label}</Text>
        <Glyph name="chevron-down" size={16} color={colors.muted} />
      </TouchableOpacity>
    </View>

    {loading && !data ? <ScreenState loading message={t("resources.loading")} />
      : error ? <ScreenState error message={t("resources.loadError")} onRetry={onRetry} retryLabel={t("ui.retry")} />
      : areaTotal === 0 ? <>
        <View style={styles.quiet}><Glyph name={area === "howToPlay" ? "book-open-variant" : "printer-3d"} size={18} color={colors.icon} /><Text style={[type.caption, styles.flex]}>{t(`resources.areaEmpty.${area}`)}.</Text></View>
        {suggestRow}
      </>
      : items.length === 0 ? <Card padded style={styles.notice}>
        <Text style={type.head}>{t("resources.noneIn", { language: languageName(t, language) })}</Text>
        <Text style={[type.body, styles.muted]}>{t(`resources.areaElsewhere.${area}`)}</Text>
        <View style={styles.alternatives}>
          {elsewhere.slice(0, 2).map(o => <Button key={o.code} title={t("resources.seeIn", { language: languageName(t, o.code), count: o.count })} onPress={() => onLanguage(o.code)} />)}
          <Button variant="plain" title={t("resources.seeAll")} onPress={() => onLanguage("all")} />
        </View>
      </Card>
      : <>
        {groups.map(group => <View key={group || "base"} style={styles.group}>
          {groups.length > 1 && <View style={styles.pad}>
            <Text style={styles.overline}>{group ? t("resources.expansion") : t("resources.baseGame")}</Text>
            {!!group && <Text style={type.head} accessibilityRole="header">{group}</Text>}
          </View>}
          {kinds.map(kind => {
            const list = items.filter(r => (r.expansion ?? "") === group && r.kind === kind);
            return list.length ? kindBlock(kind, list, !group) : null;
          })}
        </View>)}
        {elsewhere.length > 0 && <Card>
          <Row first title={t("resources.alsoIn", { language: languageName(t, elsewhere[0].code), count: elsewhere[0].count })} tone="link" onPress={() => onLanguage(elsewhere[0].code)} />
        </Card>}
        {missing.length > 0 && <View style={styles.quiet}>
          <Glyph name={area === "howToPlay" ? "play-circle-outline" : "package-variant"} size={18} color={colors.icon} />
          <Text style={[type.caption, styles.flex]}>{t("resources.missing", { list: missing.join(t("resources.missingJoin")) })}</Text>
        </View>}
        {suggestRow}
      </>}

    {canManage && <Card><Row first title={t("resources.manage")} onPress={manage} /></Card>}
    <Text style={[type.micro, styles.pad]}>{t("resources.externalNote")}</Text>
    <ResourceActionsSheet resource={menu} onClose={() => setMenu(null)} />
    <Sheet visible={choosing} title={t("resources.language.sheetTitle")} onClose={() => setChoosing(false)} closeLabel={t("resources.close")}
      right={{ label: t("resources.close"), onPress: () => setChoosing(false) }}>
      <Card>
        {options.map((o, i) => <Row key={o.key} first={i === 0} title={o.label} end="check" selected={o.key === current.key}
          onPress={() => { setChoosing(false); if (o.key !== language) onLanguage(o.key); }} />)}
      </Card>
      <Text style={type.caption}>{t("resources.language.sheetNote")}</Text>
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  area: { gap: space.xl },
  flex: { flex: 1, minWidth: 0 },
  language: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: space.sm, paddingHorizontal: space.xs },
  languageButton: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: touch, paddingHorizontal: space.md, borderRadius: touch / 2, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  pad: { paddingHorizontal: space.lg },
  overline: { ...type.micro, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  muted: { color: colors.muted },
  notice: { gap: space.md },
  alternatives: { gap: space.sm },
  group: { gap: space.lg },
  block: { gap: space.sm },
  category: { gap: space.xs },
  grid: { gap: space.lg },
  gridRow: { flexDirection: "row", gap: space.md },
  gridGap: { flex: 1 },
  quiet: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: space.lg },
  suggest: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: touch, paddingVertical: space.md, paddingHorizontal: 14, borderWidth: 1, borderStyle: "dashed", borderColor: "#D6CDE3", borderRadius: radius.card },
});
