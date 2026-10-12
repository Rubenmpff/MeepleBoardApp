/**
 * «Como jogar» or «Recursos» on the game page: resources grouped by kind (3D models by category),
 * a language choice independent of the app language, and alternatives when the chosen language has nothing.
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenState from "@/src/components/ui/ScreenState";
import { Button, Card, EmptyState, FilterChips, Note, Row, Section } from "@/src/ui/components";
import { colors, space, type } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";
import ResourceRow, { languageName } from "./ResourceRow";
import ReportResourceSheet from "./ReportResourceSheet";
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

export default function ResourceArea({ area, gameId, gameName, data, loading, error, onRetry, language, appLanguage, onLanguage, canManage }: Props) {
  const { t } = useTranslation("games");
  const router = useRouter();
  const [reporting, setReporting] = useState<GameResource | null>(null);
  const kinds = AREA_KINDS[area] as readonly ResourceKind[];

  // The user's language first, then languages that have resources, then «Todos».
  const codes = [...new Set([appLanguage, language, ...(data?.languages ?? []).map(l => l.code)].filter((c): c is string => !!c && c !== "all"))];
  const chips = [...codes.map(code => ({ key: code, label: languageName(t, code) })), { key: "all", label: t("resources.language.all") }];

  // Other languages that do have a given kind, most first.
  const alternatives = (kind: ResourceKind) => (data?.languages ?? [])
    .filter(l => l.code && l.code !== language && (l.kinds[kind] ?? 0) > 0)
    .map(l => ({ code: l.code!, count: l.kinds[kind]! }));

  const areaTotal = (data?.languages ?? []).reduce((sum, l) => sum + kinds.reduce((n, k) => n + (l.kinds[k] ?? 0), 0), 0);
  const areaItems = (data?.items ?? []).filter(r => kinds.includes(r.kind));
  // Nothing in this area for the chosen language, but other languages have something: one notice, not one per group.
  const areaAlternatives = language === "all" ? [] : (data?.languages ?? [])
    .filter(l => l.code && l.code !== language)
    .map(l => ({ code: l.code!, count: kinds.reduce((n, k) => n + (l.kinds[k] ?? 0), 0) }))
    .filter(l => l.count > 0)
    .sort((a, b) => b.count - a.count);
  const suggest = () => router.push({ pathname: ROUTES.RESOURCE_FORM, params: { gameId, gameName } } as never);

  const group = (kind: ResourceKind, items: GameResource[]) => {
    if (items.length) return <Card>{items.map((r, i) => <ResourceRow key={r.id} resource={r} first={i === 0} onReport={setReporting} />)}</Card>;
    const best = language === "all" ? undefined : alternatives(kind)[0];
    return best
      ? <Card><Row first title={t("resources.seeIn", { language: languageName(t, best.code), count: best.count })} subtitle={t("resources.noneIn", { language: languageName(t, language) })} tone="link" onPress={() => onLanguage(best.code)} /></Card>
      : <Card padded><Text style={[type.body, styles.muted]}>{t("resources.noneYet")}</Text></Card>;
  };

  return <View style={styles.area}>
    <View style={styles.language}>
      <Text style={[type.caption, styles.pad]} accessibilityRole="header">{t("resources.language.title")}</Text>
      <FilterChips items={chips} value={chips.some(c => c.key === language) ? language : "all"} onChange={onLanguage} />
      <Note inset>{t("resources.language.hint")}</Note>
    </View>

    {loading && !data ? <ScreenState loading message={t("resources.loading")} />
      : error ? <ScreenState error message={t("resources.loadError")} onRetry={onRetry} retryLabel={t("ui.retry")} />
      : areaTotal === 0 ? <EmptyState title={t(`resources.areaEmpty.${area}`)} message={t("resources.areaEmptyHint")} action={<Button variant="primary" icon="plus" title={t("resources.suggest")} onPress={suggest} />} />
      : areaItems.length === 0 && areaAlternatives.length > 0 ? <Card padded style={styles.empty}>
        <Text style={type.head}>{t("resources.noneIn", { language: languageName(t, language) })}</Text>
        <Text style={[type.body, styles.muted]}>{t(`resources.areaElsewhere.${area}`)}</Text>
        <View style={styles.alternatives}>
          {areaAlternatives.slice(0, 2).map(o => <Button key={o.code} title={t("resources.seeIn", { language: languageName(t, o.code), count: o.count })} onPress={() => onLanguage(o.code)} />)}
          <Button variant="plain" title={t("resources.seeAll")} onPress={() => onLanguage("all")} />
        </View>
      </Card>
      : kinds.map(kind => {
        const items = (data?.items ?? []).filter(r => r.kind === kind);
        if (kind !== "PrintModel") return <Section key={kind} title={t(`resources.kinds.${kind}`)} note={items.length ? String(items.length) : undefined}>{group(kind, items)}</Section>;
        // 3D models: one card per category; categories with nothing are listed in one line.
        const filled = PRINT_CATEGORIES.filter(c => items.some(r => r.printCategory === c));
        const missing = PRINT_CATEGORIES.filter(c => !filled.includes(c));
        return <Section key={kind} title={t("resources.kinds.PrintModel")} note={items.length ? String(items.length) : undefined}>
          {filled.length === 0 ? group(kind, []) : filled.map(category => <View key={category} style={styles.category}>
            <Text style={[type.caption, styles.pad]}>{t(`resources.categories.${category}`)}</Text>
            <Card>{items.filter(r => r.printCategory === category).map((r, i) => <ResourceRow key={r.id} resource={r} first={i === 0} onReport={setReporting} />)}</Card>
          </View>)}
          {filled.length > 0 && missing.length > 0 && <Note inset>{t("resources.categoriesEmpty", { list: missing.map(c => t(`resources.categories.${c}`)).join(", ") })}</Note>}
        </Section>;
      })}

    {!error && !(loading && !data) && areaTotal > 0 && <Card>
      <Row first title={t("resources.suggest")} subtitle={t("resources.suggestHint")} tone="link" onPress={suggest} />
    </Card>}
    {canManage && <Card><Row first title={t("resources.manage")} onPress={() => router.push({ pathname: ROUTES.RESOURCE_ADMIN, params: { gameId, gameName } } as never)} /></Card>}
    <Note inset>{t("resources.externalNote")}</Note>
    <ReportResourceSheet resource={reporting} onClose={() => setReporting(null)} />
  </View>;
}

const styles = StyleSheet.create({
  area: { gap: space.xl },
  language: { gap: space.sm },
  pad: { paddingHorizontal: space.lg },
  muted: { color: colors.muted },
  empty: { gap: space.md },
  alternatives: { gap: space.sm },
  category: { gap: space.xs },
});
