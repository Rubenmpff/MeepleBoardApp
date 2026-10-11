import {useStatisticsWorkspace} from '../Workspace';
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AreaHeader from "../summary/AreaHeader";
import ExploreFilters from "../ExploreFilters";
import StatisticsEvolution from "../StatisticsEvolution";
import GameCover from "@/src/components/ui/GameCover";
import useStatistics from "../hooks/useStatistics";
import { Metric, Mode, Period, Query } from "../types";
import { localISO, periodQuery } from "../utils/period";
import { formatDuration, formatPeriodLabel } from "../utils/presentation";
import ScreenScroll from "../ui/Screen";
import { Button, Card, Disclosure, EmptyState, Glyph, Hero, PendingNotice, ProportionBar, RankBar, ResultsTrio, Row, Section } from "../ui/components";
import { colors, space, strong, touch, type } from "../ui/theme";

export default function StatisticsScreen() {
 const { t, i18n } = useTranslation("statistics");
 const workspace = useStatisticsWorkspace();
 const router = useRouter();
 const params = useLocalSearchParams();
 const routeValue = (key: string) => { const value = params[key]; return Array.isArray(value) ? value[0] : value; };
 const [timeZone] = useState(() => routeValue("timeZone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
 const [anchor] = useState(() => routeValue("start") || localISO(new Date()));
 const [localPeriod, setLocalPeriod] = useState<Period>((routeValue("period") as Period) || "year");
 const [localQuery, setLocalQuery] = useState<Query>(() => ({ ...periodQuery("year", anchor, timeZone), ...(routeValue("start") ? { start: routeValue("start")!, endExclusive: routeValue("endExclusive")!, timeZone: routeValue("timeZone") || timeZone, gameId: routeValue("gameId"), mode: routeValue("mode") as Mode | undefined } : {}) }));
 const period=workspace?.period??localPeriod, setPeriod=workspace?.setPeriod??setLocalPeriod;
 const query=workspace?.query??localQuery, setQuery=workspace?.setQuery??setLocalQuery;
 const [filtersOpen, setFiltersOpen] = useState(false);
 const [allGames, setAllGames] = useState(false);
 const { data, loading, error, refetch } = useStatistics(query);
 const number = (value: number | null) => value == null ? t("unavailable") : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(value);
 const show = (metric: Metric, extra: Partial<Query> & { bucket?: string } = {}) => router.push({ pathname: "/statistics/matches", params: { ...query, ...extra, metric } } as never);
 const team = query.mode === "COOPERATIVE";

 const notes = <Section title={t("moreDetails")}><Card>
  {!!data && data.matches > 0 && <>
   {data.matchesWithoutDuration > 0 && <Row first title={t("missingDurationRow")} value={number(data.matchesWithoutDuration)} accessibilityLabel={t("missingDuration", { count: data.matchesWithoutDuration })} accessibilityHint={t("viewSupporting")} onPress={() => show("missing-duration")} />}
   {data.results.legacy > 0 && <Row first={data.matchesWithoutDuration === 0} title={t("legacyRow")} subtitle={t("legacyIncluded", { count: data.results.withoutResult })} value={number(data.results.legacy)} accessibilityLabel={t("legacy", { count: data.results.legacy })} accessibilityHint={t("viewSupporting")} onPress={() => show("legacy")} />}
   <Row first={data.matchesWithoutDuration === 0 && data.results.legacy === 0} title={t("averageRating")} subtitle={t("ratingCoverage", { known: data.ratedMatches, total: data.matches })} value={data.averagePersonalRating == null ? "—" : number(data.averagePersonalRating)}
    accessibilityLabel={`${t("averageRating")}: ${number(data.averagePersonalRating)}`} accessibilityHint={t("viewSupporting")} onPress={() => show("ratings")} />
  </>}
  <Disclosure first={!data || data.matches === 0} title={t("howCalculated")}>
   <Text style={type.caption}>{t("timeZone", { zone: query.timeZone })}</Text>
   {[t("rateRule"), t("legacyRule"), t("durationRule"), t("ratingRule"), t("teamRule")].map(rule => <Text key={rule} style={type.body}>{rule}</Text>)}
   <Text style={type.caption}>{t("historyScope")}</Text>
   {!!data && <TouchableOpacity style={s.link} accessibilityRole="button" onPress={refetch}><Text style={[type.body, strong, { color: colors.primary }]}>{t("refresh")}</Text></TouchableOpacity>}
  </Disclosure>
 </Card></Section>;

 const visibleGames = data ? data.games.filter((g, index) => allGames || index < 3 || g.matches === data.games[2]?.matches) : [];
 const topGame = Math.max(1, ...(data?.games.map(g => g.matches) ?? [1]));
 return <SafeAreaView style={s.screen} edges={workspace?[]:["top", "left", "right"]}>
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
   <ScreenScroll>
    <View>
     <AreaHeader area="summary" query={query} period={period} />
     <ExploreFilters query={query} onChange={setQuery} games={data?.gameOptions??[]} initialPeriod={period} onPeriodChange={setPeriod} visible={filtersOpen} onVisibilityChange={setFiltersOpen}/>
    </View>
    {loading ? <Card padded style={s.state} ><ActivityIndicator color={colors.primary} /><Text style={[type.body, { color: colors.muted }]} accessibilityState={{ busy: true }}>{t("loading")}</Text></Card>
     : error ? <Card padded style={s.state}><Text style={type.body} accessibilityRole="alert">{t("error")}</Text><Button title={t("retry")} onPress={refetch} /></Card>
     : data && (data.matches === 0 ? <EmptyState title={t("emptyTitle", { period: formatPeriodLabel(period, query, i18n.language) })} message={t("emptyHint")}
       action={<Button title={t("changeFilters")} icon="tune-variant" onPress={() => setFiltersOpen(true)} />} /> : <>
      <Hero>
       <View style={s.pair}>
        <TouchableOpacity style={s.stat} accessibilityRole="button" accessibilityLabel={`${t("matches")}: ${number(data.matches)}`} accessibilityHint={t("viewSupporting")} onPress={() => show("all")}>
         <View style={s.label}><Glyph name="dice-5" size={16} color={colors.icon} /><Text style={type.caption}>{t("matches")}</Text></View>
         <Text style={type.display}>{number(data.matches)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.stat} accessibilityRole="button" accessibilityLabel={`${t("gamesLabel", { count: data.distinctGames })}: ${number(data.distinctGames)}`} accessibilityHint={t("viewSupporting")} onPress={() => show("games")}>
         <View style={s.label}><Glyph name="chess-pawn" size={16} color={colors.icon} /><Text style={type.caption}>{t("gamesLabel", { count: data.distinctGames })}</Text></View>
         <Text style={type.display}>{number(data.distinctGames)}</Text>
        </TouchableOpacity>
       </View>
       <TouchableOpacity style={s.heroFoot} accessibilityRole="button" accessibilityLabel={`${t("recordedTime")}: ${data.recordedMinutes == null ? t("noDuration") : formatDuration(data.recordedMinutes, i18n.language)}`} accessibilityHint={t("viewSupporting")} onPress={() => show(data.recordedMinutes == null ? "missing-duration" : "duration")}>
        <Glyph name="clock-outline" size={18} color={colors.muted} />
        <Text style={[type.body, s.flex]}>{data.recordedMinutes == null ? t("noDuration") : t("recordedSummary", { duration: formatDuration(data.recordedMinutes, i18n.language) })}</Text>
        {data.recordedMinutes != null && <Text style={type.caption}>{t("durationShare", { known: data.matchesWithDuration, total: data.matches })}</Text>}
        <Glyph name="chevron-right" />
       </TouchableOpacity>
      </Hero>

      <Section title={t(data.bucketUnit === "month" ? "monthlyMatches" : "dailyMatches")}>
       <StatisticsEvolution compact buckets={data.evolution} unit={data.bucketUnit} language={i18n.language} title={t(data.bucketUnit === "month" ? "monthlyMatches" : "dailyMatches")} countLabel={count => t("matchCount", { count })} onSelect={bucket => show("all", { bucket })}/>
      </Section>

      <Section title={t("personalResults")} note={team ? t("teamResultShort") : t("knownCompact", { count: data.results.known })}>
       <Card>
        {data.results.known > 0 ? <View style={s.results}>
         <ResultsTrio items={[
          { icon: "trophy", color: colors.primary, value: number(data.results.wins), label: t("wins"), accessibilityLabel: `${t("wins")}: ${number(data.results.wins)}`, onPress: () => show("wins") },
          { icon: "close-thick", color: colors.loss, value: number(data.results.losses), label: t("losses"), accessibilityLabel: `${t("losses")}: ${number(data.results.losses)}`, onPress: () => show("losses") },
          { icon: "handshake", color: colors.draw, value: number(data.results.draws), label: t("draws"), accessibilityLabel: `${t("draws")}: ${number(data.results.draws)}`, onPress: () => show("draws") },
         ]} />
         <ProportionBar parts={[{ value: data.results.wins, color: colors.primary }, { value: data.results.losses, color: colors.loss }, { value: data.results.draws, color: colors.draw }]} />
         <TouchableOpacity style={s.rate} accessibilityRole="button" accessibilityLabel={`${t("winRate")}: ${data.results.winRate == null ? t("unavailable") : `${number(data.results.winRate)}%`}`} accessibilityHint={t("viewSupporting")} onPress={() => show("known")}>
          <Text style={[type.body, s.flex]}>{t("winRate")}</Text>
          <Text style={[type.head, s.numeric]}>{data.results.winRate == null ? "—" : `${number(data.results.winRate)}%`}</Text>
          <Glyph name="chevron-right" />
         </TouchableOpacity>
        </View> : <View style={s.results}><Text style={[type.body, { color: colors.muted }]}>{t("noConfirmedResults")}</Text></View>}
        {data.results.withoutResult > 0 && <PendingNotice style={s.inCard} label={t("unknownCompact", { count: data.results.withoutResult })} accessibilityLabel={t("withoutResult", { count: data.results.withoutResult })} onPress={() => show("undefined")} />}
       </Card>
      </Section>

      <Section title={t("mostPlayed")}>
       <Card>
        {visibleGames.map((game, index) => <Row key={game.gameId} first={index === 0} inset={72} lead={<GameCover uri={game.imageUrl} style={s.cover} iconSize={22} />} title={game.name} strongTitle
         detail={<RankBar value={game.matches} max={topGame} />}
         value={number(game.matches)} accessibilityLabel={game.name} accessibilityHint={t("viewSupporting")} onPress={() => show("all", { gameId: game.gameId })} />)}
        {data.games.some((g, index) => index >= 3 && g.matches !== data.games[2]?.matches) && <Row title={t(allGames ? "showLessGames" : "showAllGames")} tone="link" end={allGames ? "collapse" : "expand"} onPress={() => setAllGames(v => !v)} />}
       </Card>
      </Section>
     </>)}
    {!loading && !error && notes}
   </ScreenScroll>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}

const s = StyleSheet.create({
 screen: { flex: 1, backgroundColor: colors.background },
 flex: { flex: 1, minWidth: 0 },
 numeric: { fontVariant: ["tabular-nums"] },
 state: { gap: space.md, alignItems: "flex-start" },
 pair: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
 stat: { flex: 1, minWidth: 120, minHeight: touch, gap: 2 },
 label: { flexDirection: "row", alignItems: "center", gap: 6 },
 heroFoot: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch, borderTopWidth: 1, borderTopColor: colors.heroLine, paddingTop: 10, marginBottom: -4, flexWrap: "wrap" },
 results: { padding: space.lg, gap: space.md },
 rate: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch, marginBottom: -space.sm },
 inCard: { marginHorizontal: space.lg, marginBottom: space.lg },
 cover: { width: 44, height: 44, borderRadius: 10 },
 link: { minHeight: touch, justifyContent: "center", alignSelf: "flex-start" },
});
