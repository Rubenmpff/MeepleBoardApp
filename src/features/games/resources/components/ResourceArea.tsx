/**
 * «Como jogar» or «Recursos» on the game page. Resources of the base game first, then one group per expansion;
 * inside each, only the kinds (and 3D categories) that have something. Nothing at all: a single empty state.
 * The language choice is independent of the app language; when it has nothing, one notice offers the others.
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenState from "@/src/components/ui/ScreenState";
import { Button, Card, EmptyState, FilterChips, Row } from "@/src/ui/components";
import { colors, space, strong, type } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";
import ResourceRow, { languageName } from "./ResourceRow";
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

export default function ResourceArea({ area, gameId, gameName, data, loading, error, onRetry, language, appLanguage, onLanguage, canManage }: Props) {
  const { t } = useTranslation("games");
  const router = useRouter();
  const [menu, setMenu] = useState<GameResource | null>(null);
  const kinds = AREA_KINDS[area] as readonly ResourceKind[];

  // The user's language first, then languages that have resources, then «Todos».
  const codes = [...new Set([appLanguage, language, ...(data?.languages ?? []).map(l => l.code)].filter((c): c is string => !!c && c !== "all"))];
  const chips = [...codes.map(code => ({ key: code, label: languageName(t, code) })), { key: "all", label: t("resources.language.all") }];

  const areaTotal = (data?.languages ?? []).reduce((sum, l) => sum + kinds.reduce((n, k) => n + (l.kinds[k] ?? 0), 0), 0);
  const items = (data?.items ?? []).filter(r => kinds.includes(r.kind));
  // Other languages with something in this area, most first.
  const elsewhere = language === "all" ? [] : (data?.languages ?? [])
    .filter(l => l.code && l.code !== language)
    .map(l => ({ code: l.code!, count: kinds.reduce((n, k) => n + (l.kinds[k] ?? 0), 0) }))
    .filter(l => l.count > 0)
    .sort((a, b) => b.count - a.count);
  const suggest = () => router.push({ pathname: ROUTES.RESOURCE_FORM, params: { gameId, gameName } } as never);

  // The API lists the base game first, then each expansion; keep that order.
  const groups = [...new Set(items.map(r => r.expansion ?? ""))];
  const card = (list: GameResource[]) => <Card>{list.map((r, i) => <ResourceRow key={r.id} resource={r} first={i === 0} onMenu={setMenu} />)}</Card>;
  const kindBlock = (kind: ResourceKind, list: GameResource[]) => {
    if (kind !== "PrintModel") return <View key={kind} style={styles.block}><Text style={[type.caption, strong, styles.pad]} accessibilityRole="header">{t(`resources.kinds.${kind}`)}</Text>{card(list)}</View>;
    return <View key={kind} style={styles.block}>
      <Text style={[type.caption, strong, styles.pad]} accessibilityRole="header">{t("resources.kinds.PrintModel")}</Text>
      {PRINT_CATEGORIES.filter(c => list.some(r => r.printCategory === c)).map(c => <View key={c} style={styles.category}>
        <Text style={[type.micro, styles.pad]}>{t(`resources.categories.${c}`)}</Text>
        {card(list.filter(r => r.printCategory === c))}
      </View>)}
    </View>;
  };

  return <View style={styles.area}>
    <View style={styles.language}>
      <Text style={[type.micro, styles.pad]}>{t("resources.language.title")}</Text>
      <FilterChips items={chips} value={chips.some(c => c.key === language) ? language : "all"} onChange={onLanguage} />
    </View>

    {loading && !data ? <ScreenState loading message={t("resources.loading")} />
      : error ? <ScreenState error message={t("resources.loadError")} onRetry={onRetry} retryLabel={t("ui.retry")} />
      : areaTotal === 0 ? <EmptyState title={t(`resources.areaEmpty.${area}`)} message={t("resources.areaEmptyHint")} action={<Button variant="primary" icon="plus" title={t("resources.suggest")} onPress={suggest} />} />
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
            {!!group && <Text style={type.micro}>{t("resources.expansion")}</Text>}
            <Text style={type.head} accessibilityRole="header">{group || t("resources.baseGame")}</Text>
          </View>}
          {kinds.map(kind => {
            const list = items.filter(r => (r.expansion ?? "") === group && r.kind === kind);
            return list.length ? kindBlock(kind, list) : null;
          })}
        </View>)}
        {elsewhere.length > 0 && <Card>
          <Row first title={t("resources.alsoIn", { language: languageName(t, elsewhere[0].code), count: elsewhere[0].count })} tone="link" onPress={() => onLanguage(elsewhere[0].code)} />
        </Card>}
      </>}

    {!error && !(loading && !data) && areaTotal > 0 && <Card>
      <Row first title={t("resources.suggest")} subtitle={t("resources.suggestHint")} tone="link" onPress={suggest} />
      {canManage && <Row title={t("resources.manage")} onPress={() => router.push({ pathname: ROUTES.RESOURCE_ADMIN, params: { gameId, gameName } } as never)} />}
    </Card>}
    {canManage && (error || areaTotal === 0) && <Card><Row first title={t("resources.manage")} onPress={() => router.push({ pathname: ROUTES.RESOURCE_ADMIN, params: { gameId, gameName } } as never)} /></Card>}
    <Text style={[type.micro, styles.pad]}>{t("resources.externalNote")}</Text>
    <ResourceActionsSheet resource={menu} onClose={() => setMenu(null)} />
  </View>;
}

const styles = StyleSheet.create({
  area: { gap: space.xl },
  language: { gap: space.xs },
  pad: { paddingHorizontal: space.lg },
  muted: { color: colors.muted },
  notice: { gap: space.md },
  alternatives: { gap: space.sm },
  group: { gap: space.lg },
  block: { gap: space.sm },
  category: { gap: space.xs },
});
