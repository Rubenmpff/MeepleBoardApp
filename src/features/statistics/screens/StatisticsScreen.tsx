import { useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import StatisticsHeader from "../StatisticsHeader";
import StatisticsEvolution from "../StatisticsEvolution";
import GameCover from "@/src/components/ui/GameCover";
import Button from "@/src/components/ui/ClubPrimaryButton";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
import useStatistics from "../hooks/useStatistics";
import { Metric, Mode, Period, Query } from "../types";
import { customQuery, inclusiveEnd, localISO, periodQuery, shiftAnchor } from "../utils/period";
import { styles } from "../styles";

const MODES: Mode[] = ["COMPETITIVE", "SOLO", "COOPERATIVE", "UNKNOWN"];
export default function StatisticsScreen() {
 const { width, fontScale } = useWindowDimensions();
 const { t, i18n } = useTranslation("statistics");
 const router = useRouter();
 const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
 const [anchor, setAnchor] = useState(() => localISO(new Date()));
 const [period, setPeriod] = useState<Period>("year");
 const [query, setQuery] = useState<Query>(() => periodQuery("year", localISO(new Date()), timeZone));
 const [customStart, setCustomStart] = useState(query.start);
 const [customEnd, setCustomEnd] = useState(inclusiveEnd(query.endExclusive));
 const [invalid, setInvalid] = useState(false);
 const [chooseGame, setChooseGame] = useState(false);
 const [chooseMode, setChooseMode] = useState(false);
 const [calculations, setCalculations] = useState(false);
 const { data, loading, error, refetch } = useStatistics(query);
 const stacked = width < 360 || fontScale > 1.25;
 const number = (value: number | null) => value == null ? t("unavailable") : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(value);
 const dateLabel = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(i18n.language, { ...options, timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
 const periodLabel = period === "year" ? query.start.slice(0, 4) : period === "month" ? dateLabel(query.start, { month: "long", year: "numeric" }) : `${dateLabel(query.start, { day: "numeric", month: "short", year: "numeric" })} — ${dateLabel(inclusiveEnd(query.endExclusive), { day: "numeric", month: "short", year: "numeric" })}`;
 const show = (metric: Metric, extra: Partial<Query> & { bucket?: string } = {}) => router.push({ pathname: "/statistics/matches", params: { ...query, ...extra, metric } } as never);
 const changePeriod = (next: Period) => {
  setPeriod(next); setInvalid(false);
  if (next === "custom") { setCustomStart(query.start); setCustomEnd(inclusiveEnd(query.endExclusive)); }
  else setQuery(q => ({ ...q, ...periodQuery(next, anchor, timeZone) }));
 };
 const shift = (direction: number) => {
  const next = shiftAnchor(anchor, period, direction); setAnchor(next);
  if (period !== "custom") setQuery(q => ({ ...q, ...periodQuery(period, next, timeZone) }));
 };
 const modeLabel = query.mode ? t(`modes.${query.mode}`) : t("allModes");
 const gameLabel = query.gameId ? data?.gameOptions.find(g => g.gameId === query.gameId)?.name ?? t("selectedGame") : t("allGames");
 const metric = (label: string, value: string, action: () => void, columns = 2) => <TouchableOpacity key={label}
  style={[styles.metric, { flexBasis: stacked ? "100%" : columns === 3 ? "30%" : "46%" }]}
  accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint={t("viewSupporting")} onPress={action}>
  <Text style={styles.value}>{value}</Text><Text style={styles.text}>{label}</Text>
 </TouchableOpacity>;
 const supporting = (label: string, action: () => void) => <TouchableOpacity style={styles.inlineAction} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={t("viewSupporting")} onPress={action}>
  <Text style={[styles.muted, styles.grow]}>{label}</Text><Text style={styles.link} importantForAccessibility="no">›</Text>
 </TouchableOpacity>;

 return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
   <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
    <StatisticsHeader title={t("title")} backLabel={t("back")} onBack={() => router.canGoBack() ? router.back() : router.replace("/dashboard")} />
    <View style={styles.stack}>
     <View style={styles.periods}>{(["week", "month", "year", "custom"] as Period[]).map(p => <TouchableOpacity key={p}
      accessibilityRole="button" accessibilityState={{ selected: p === period }} style={[styles.period, p === period && styles.selected]}
      onPress={() => changePeriod(p)}><Text style={[styles.text, p === period && styles.selectedText]}>{t(`period.${p}`)}</Text></TouchableOpacity>)}</View>
     <View style={styles.row}>
      {period !== "custom" && <TouchableOpacity style={styles.periodArrow} accessibilityRole="button" accessibilityLabel={t("previousPeriod")} onPress={() => shift(-1)}><Text style={styles.link}>‹</Text></TouchableOpacity>}
      <Text style={[styles.title, { flex: 1, textAlign: "center" }]}>{periodLabel}</Text>
      {period !== "custom" && <TouchableOpacity style={styles.periodArrow} accessibilityRole="button" accessibilityLabel={t("nextPeriod")} onPress={() => shift(1)}><Text style={styles.link}>›</Text></TouchableOpacity>}
     </View>
     {period === "custom" && <View style={styles.stack}>
      <Text style={styles.text}>{t("startDate")}</Text><TextInput style={styles.input} value={customStart} onChangeText={setCustomStart} accessibilityLabel={t("startDate")} placeholder="AAAA-MM-DD" autoCorrect={false} />
      <Text style={styles.text}>{t("endDate")}</Text><TextInput style={styles.input} value={customEnd} onChangeText={setCustomEnd} accessibilityLabel={t("endDate")} placeholder="AAAA-MM-DD" autoCorrect={false} />
      <Button title={t("apply")} onPress={() => { const bounds = customQuery(customStart, customEnd, timeZone); setInvalid(!bounds); if (bounds) { setQuery(q => ({ ...q, ...bounds })); Keyboard.dismiss(); } }} />
      {invalid && <Text style={styles.text} accessibilityRole="alert">{t("invalidDates")}</Text>}
     </View>}
     <View style={styles.row}>
      <TouchableOpacity style={[styles.selector, { flexBasis: stacked ? "100%" : "46%" }]} accessibilityRole="button" accessibilityLabel={`${t("game")}: ${gameLabel}`} accessibilityState={{ expanded: chooseGame }}
       onPress={() => { setChooseGame(v => !v); setChooseMode(false); }}>
       <View style={styles.grow}><Text style={styles.muted}>{t("game")}</Text><Text style={styles.selectorValue}>{gameLabel}</Text></View><Text style={styles.link} importantForAccessibility="no">⌄</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.selector, { flexBasis: stacked ? "100%" : "46%" }]} accessibilityRole="button" accessibilityLabel={`${t("mode")}: ${modeLabel}`} accessibilityState={{ expanded: chooseMode }}
       onPress={() => { setChooseMode(v => !v); setChooseGame(false); }}>
       <View style={styles.grow}><Text style={styles.muted}>{t("mode")}</Text><Text style={styles.selectorValue}>{modeLabel}</Text></View><Text style={styles.link} importantForAccessibility="no">⌄</Text>
      </TouchableOpacity>
     </View>
     {chooseGame && <View style={styles.options}>
      <TouchableOpacity style={styles.option} accessibilityRole="button" accessibilityState={{ selected: !query.gameId }} onPress={() => { setQuery(q => ({ ...q, gameId: undefined })); setChooseGame(false); }}><Text style={styles.text}>{t("allGames")}{!query.gameId ? " ✓" : ""}</Text></TouchableOpacity>
      {data?.gameOptions.map(game => <TouchableOpacity key={game.gameId} style={styles.option} accessibilityRole="button" accessibilityLabel={t("selectGame", { name: game.name })} accessibilityState={{ selected: query.gameId === game.gameId }} onPress={() => { setQuery(q => ({ ...q, gameId: game.gameId })); setChooseGame(false); }}><Text style={styles.text}>{game.name}{query.gameId === game.gameId ? " ✓" : ""}</Text></TouchableOpacity>)}
     </View>}
     {chooseMode && <View style={styles.options}>
      {([undefined, ...MODES] as (Mode | undefined)[]).map(mode => <TouchableOpacity key={mode ?? "all"} style={styles.option} accessibilityRole="button" accessibilityState={{ selected: query.mode === mode }} onPress={() => { setQuery(q => ({ ...q, mode })); setChooseMode(false); }}>
       <Text style={styles.text}>{mode ? t(`modes.${mode}`) : t("allModes")}{query.mode === mode ? " ✓" : ""}</Text>
      </TouchableOpacity>)}
     </View>}
    </View>
    {loading ? <View accessibilityState={{ busy: true }}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.muted}>{t("loading")}</Text></View>
     : error ? <View style={styles.stack}><Text style={styles.text} accessibilityRole="alert">{t("error")}</Text><Button title={t("retry")} onPress={refetch} /></View>
     : data && <>
      {data.matches === 0 && <Text style={styles.text}>{t("empty")}</Text>}
      <View style={styles.summary}>
       <View style={[styles.row, styles.metricsRow]}>
        {metric(t("matches"), number(data.matches), () => show("all"))}
        {metric(t("games"), number(data.distinctGames), () => show("games"))}
       </View>
       <TouchableOpacity style={styles.timeLine} accessibilityRole="button" accessibilityLabel={`${t("recordedTime")}: ${data.recordedMinutes == null ? t("noDuration") : `${number(data.recordedMinutes)} min`}`} accessibilityHint={t("viewSupporting")} onPress={() => show(data.recordedMinutes == null ? "missing-duration" : "duration")}>
        <Text style={styles.text}>{t("recordedTime")}</Text>
        <Text style={styles.inlineValue}>{data.recordedMinutes == null ? t("noDuration") : `${number(data.recordedMinutes)} min`}</Text>
        <Text style={styles.muted}>{t("durationCoverage", { known: data.matchesWithDuration, total: data.matches })}</Text>
       </TouchableOpacity>
       {data.matchesWithoutDuration > 0 && supporting(t("missingDuration", { count: data.matchesWithoutDuration }), () => show("missing-duration"))}
      </View>
      <StatisticsEvolution buckets={data.evolution} unit={data.bucketUnit} language={i18n.language} title={t("evolution")} countLabel={count => t("matchCount", { count })} onSelect={bucket => show("all", { bucket })} />
      <View style={styles.section}>
       <View style={styles.row}><Text style={[styles.title, styles.grow]} accessibilityRole="header">{t("results")}</Text><Text style={styles.muted}>{modeLabel}</Text></View>
       {query.mode === "COOPERATIVE" && <Text style={styles.muted}>{t("teamResult")}</Text>}
       <View style={[styles.row, styles.metricsRow]}>
        {metric(t("wins"), number(data.results.wins), () => show("wins"), 3)}
        {metric(t("losses"), number(data.results.losses), () => show("losses"), 3)}
        {metric(t("draws"), number(data.results.draws), () => show("draws"), 3)}
       </View>
       <TouchableOpacity style={styles.rate} accessibilityRole="button" accessibilityLabel={`${t("winRate")}: ${data.results.winRate == null ? t("unavailable") : `${number(data.results.winRate)}%`}`} accessibilityHint={t("viewSupporting")} onPress={() => show("known")}>
        <View style={styles.grow}><Text style={styles.text}>{t("winRate")}</Text><Text style={styles.muted}>{t("knownResults", { count: data.results.known })}</Text></View>
        <Text style={styles.rateValue}>{data.results.winRate == null ? "—" : `${number(data.results.winRate)}%`}</Text>
       </TouchableOpacity>
       {data.results.withoutResult > 0 && supporting(t("withoutResult", { count: data.results.withoutResult }), () => show("undefined"))}
       {data.results.legacy > 0 && supporting(t("legacy", { count: data.results.legacy }), () => show("legacy"))}
      </View>
      <View style={styles.section}>
       <Text style={styles.title} accessibilityRole="header">{t("personalRating")}</Text>
       <TouchableOpacity style={styles.inlineAction} accessibilityRole="button" accessibilityLabel={`${t("averageRating")}: ${number(data.averagePersonalRating)}`} accessibilityHint={t("viewSupporting")} onPress={() => show("ratings")}>
        <View style={styles.grow}><Text style={styles.text}>{t("averageRating")}</Text><Text style={styles.muted}>{t("ratingCoverage", { known: data.ratedMatches, total: data.matches })}</Text></View>
        <Text style={styles.inlineValue}>{data.averagePersonalRating == null ? "—" : number(data.averagePersonalRating)}</Text>
       </TouchableOpacity>
      </View>
      <View style={styles.section}>
       <Text style={styles.title} accessibilityRole="header">{t("mostPlayed")}</Text>
       {data.games.filter((g, index) => index < 5 || g.matches === data.games[4]?.matches).map(game => <TouchableOpacity key={game.gameId} style={styles.gameRow} accessibilityRole="button" accessibilityLabel={game.name} accessibilityHint={t("viewSupporting")} onPress={() => show("all", { gameId: game.gameId })}>
        <GameCover uri={game.imageUrl} style={styles.cover} /><View style={styles.grow}><Text style={styles.gameName}>{game.name}</Text><Text style={styles.muted}>{t("matchCount", { count: game.matches })}</Text></View><Text style={styles.link} importantForAccessibility="no">›</Text>
       </TouchableOpacity>)}
      </View>
     </>}
    <View style={styles.section}>
     <TouchableOpacity style={styles.inlineAction} accessibilityRole="button" accessibilityLabel={t("howCalculated")} accessibilityState={{ expanded: calculations }} onPress={() => setCalculations(v => !v)}>
      <Text style={[styles.link, styles.grow]}>{t("howCalculated")}</Text><Text style={styles.link} importantForAccessibility="no">{calculations ? "⌃" : "⌄"}</Text>
     </TouchableOpacity>
     {calculations && <View style={styles.stack}>
      <Text style={styles.muted}>{t("timeZone", { zone: timeZone })}</Text><Text style={styles.text}>{t("rateRule")}</Text>
      <Text style={styles.text}>{t("legacyRule")}</Text><Text style={styles.text}>{t("durationRule")}</Text>
      <Text style={styles.text}>{t("ratingRule")}</Text><Text style={styles.text}>{t("teamRule")}</Text>
      <Text style={styles.muted}>{t("historyScope")}</Text>
     </View>}
     {!!data && <TouchableOpacity style={styles.inlineAction} accessibilityRole="button" onPress={refetch}><Text style={styles.link}>{t("refresh")}</Text></TouchableOpacity>}
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
