/**
 * Every match I played, whatever the game or session (Jogar → Partidas).
 * Reads the list that already backs the statistics (/statistics/me/matches); no new contract.
 * Filters live in this component, so opening a match and coming back keeps them and the scroll position.
 */
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import ScreenState from "@/src/components/ui/ScreenState";
import GameCover from "@/src/components/ui/GameCover";
import Sheet from "@/src/ui/Sheet";
import { Button, Card, EmptyState, FilterChips, Glyph, Note, Row } from "@/src/ui/components";
import { colors, space, strong, type } from "@/src/ui/theme";
import { formatDate, formatRating } from "@/src/ui/format";
import { ROUTES } from "@/src/constants/routes";
import statisticsService from "@/src/features/statistics/services/statisticsService";
import { FilterButton } from "@/src/features/statistics/ExploreFilters";
import { localISO, periodQuery } from "@/src/features/statistics/utils/period";
import { GameSummary, MatchPage, Mode, Query, SupportingMatch } from "@/src/features/statistics/types";

type Result = "all" | "wins" | "losses" | "draws" | "undefined";
/** "all", "month" or a calendar year such as "2025". */
type Range = string;
type Filters = { result: Result; range: Range; gameId?: string; mode?: Mode };

const RESULTS: Result[] = ["all", "wins", "losses", "draws", "undefined"];
const MODES: Mode[] = ["COMPETITIVE", "SOLO", "COOPERATIVE", "UNKNOWN"];
const DEFAULT: Filters = { result: "all", range: "all" };
// The statistics contract accepts at most 3660 days; "all dates" is that window ending today (H-LIST01).
const MAX_DAYS = 3660;
// Filters survive leaving Jogar for the rest of the app session, per account.
const remembered = new Map<string, Filters>();
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function rangeQuery(range: Range, timeZone: string, today = new Date()): Query {
  if (range === "month") return periodQuery("month", localISO(today), timeZone);
  if (range !== "all") return periodQuery("year", `${range}-01-01`, timeZone);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12);
  const start = new Date(end);
  start.setDate(end.getDate() - MAX_DAYS);
  return { start: localISO(start), endExclusive: localISO(end), timeZone };
}

export default function MatchHistoryScreen() {
  const { t, i18n } = useTranslation("matches");
  const router = useRouter();
  const language = i18n?.language ?? "pt";
  const account = useSelector((state: RootState) => state.auth.user?.id) ?? "";
  const [filters, setFilters] = useState<Filters>(() => remembered.get(account) ?? DEFAULT);
  useEffect(() => { remembered.set(account, filters); }, [account, filters]);
  const [page, setPage] = useState<MatchPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [sheet, setSheet] = useState<null | "main" | "range" | "game" | "mode">(null);
  const timeZone = useRef(zone()).current;
  const request = useRef(0);

  const query = useCallback((f: Filters): Query => ({ ...rangeQuery(f.range, timeZone), gameId: f.gameId, mode: f.mode }), [timeZone]);

  // Games and years with matches, for the filter choices.
  const loadOptions = useCallback(() => statisticsService.summary(rangeQuery("all", timeZone)).then(summary => {
    setGames(summary.gameOptions ?? summary.games ?? []);
    setYears([...new Set(summary.evolution.filter(bucket => bucket.matches > 0).map(bucket => bucket.key.slice(0, 4)))].sort().reverse());
  }).catch(() => undefined), [timeZone]);

  const load = useCallback(async (f: Filters, offset: number, silent = false) => {
    const id = ++request.current;
    if (offset > 0) setLoadingMore(true); else if (!silent) setLoading(true);
    try {
      const result = await statisticsService.matches(query(f), f.result, offset);
      if (id !== request.current) return;
      setError(false);
      setPage(previous => offset > 0 && previous ? { ...result, items: [...previous.items, ...result.items] } : result);
    } catch {
      if (id === request.current && offset === 0) setError(true);
    } finally {
      if (id === request.current) { setLoading(false); setLoadingMore(false); setRefreshing(false); }
    }
  }, [query]);

  useEffect(() => { void load(filters, 0); }, [filters, load]);
  useEffect(() => { void loadOptions(); }, [loadOptions]);

  // Back from a match keeps the list; it reloads only when the total changed (a match registered or removed elsewhere).
  const focused = useRef(false);
  const total = useRef<number | null>(null);
  total.current = page?.total ?? null;
  useFocusEffect(useCallback(() => {
    if (!focused.current) { focused.current = true; return; }
    statisticsService.matches(query(filters), filters.result, 0).then(first => {
      if (first.total !== total.current) { setPage(first); void loadOptions(); }
    }).catch(() => undefined);
  }, [filters, query, loadOptions]));

  const change = (next: Partial<Filters>) => setFilters(f => ({ ...f, ...next }));
  const rangeLabel = (range: Range) => range === "all" ? t("history.allDates") : range === "month" ? t("history.thisMonth") : range;
  const gameLabel = filters.gameId ? games.find(g => g.gameId === filters.gameId)?.name ?? t("history.selectedGame") : t("history.allGames");
  const modeLabel = filters.mode ? t(`statistics:modes.${filters.mode}`) : t("history.allModes");
  const active = (filters.range !== "all" ? 1 : 0) + (filters.gameId ? 1 : 0) + (filters.mode ? 1 : 0);
  const filtered = active > 0 || filters.result !== "all";
  const outcome = (m: SupportingMatch) => m.resultSource === "Legacy" ? t("statistics:legacyItem") : m.outcome ? t(`statistics:outcomes.${m.outcome}`) : t("statistics:undefinedItem");

  const header = <View style={styles.header}>
    <FilterChips items={RESULTS.map(key => ({ key, label: t(`history.results.${key}`) }))} value={filters.result} onChange={result => change({ result })} />
    <Card style={styles.scope}>
      <TouchableOpacity style={styles.scopeMain} accessibilityRole="button" accessibilityLabel={`${t("history.period")}: ${rangeLabel(filters.range)} · ${gameLabel} · ${modeLabel}`}
        accessibilityHint={t("history.filters")} onPress={() => setSheet("main")}>
        <View style={styles.line}><Text style={[type.body, strong, styles.shrink]}>{rangeLabel(filters.range)}</Text><Glyph name="chevron-down" size={18} color={colors.primary} /></View>
        <Text style={type.caption}>{gameLabel} · {modeLabel}</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <FilterButton count={active} onPress={() => setSheet("main")} expanded={sheet !== null} />
    </Card>
    {page && !error && <Note inset>{t("history.count", { count: page.total })}{filters.range === "all" ? ` · ${t("history.tenYears")}` : ""}</Note>}
  </View>;

  const footer = page && page.items.length < page.total && !error
    ? <View style={styles.footer}><Button title={loadingMore ? t("history.loadingMore") : t("history.more")} disabled={loadingMore} onPress={() => { void load(filters, page.items.length); }} /></View>
    : null;

  const empty = loading ? <ScreenState loading message={t("ui.loading")} />
    : error ? <ScreenState error message={t("history.error")} onRetry={() => { void load(filters, 0); }} retryLabel={t("ui.retry")} />
    : filtered ? <EmptyState title={t("history.noResultsTitle")} message={t("history.noResults")} action={<Button title={t("history.clear")} onPress={() => setFilters(DEFAULT)} />} />
    : <EmptyState title={t("history.emptyTitle")} message={t("history.emptyBody")} action={<Button variant="primary" icon="plus" title={t("history.register")} onPress={() => router.push(ROUTES.REGISTER_MATCH)} />} />;

  const pick = (key: string, title: string, selected: boolean, onPress: () => void, first: boolean, lead?: ReactNode) =>
    <Row key={key} first={first} title={title} end="check" selected={selected} inset={lead ? 72 : undefined} lead={lead} onPress={() => { onPress(); setSheet("main"); }} />;

  return <>
    <FlatList
      data={loading || error ? [] : page?.items ?? []}
      keyExtractor={item => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} tintColor={colors.primary}
        onRefresh={() => { setRefreshing(true); void loadOptions(); void load(filters, 0, true); }} />}
      renderItem={({ item, index }) => {
        const rating = item.personalRating == null ? null : t("history.rating", { value: formatRating(item.personalRating, language) });
        const count = page?.items.length ?? 0;
        return <View style={[styles.cell, index === 0 && styles.cellFirst, index === count - 1 && styles.cellLast]}>
          <Row first={index === 0} inset={72} strongTitle title={item.gameName} lead={<GameCover uri={item.gameImageUrl} size={44} />}
            subtitle={[formatDate(item.matchDate, language), t(`statistics:modes.${item.gameMode}`)].join(" · ")}
            detail={<Text style={[type.caption, styles.result]}>{[outcome(item), rating].filter(Boolean).join(" · ")}</Text>}
            accessibilityLabel={`${item.gameName}, ${formatDate(item.matchDate, language)}, ${outcome(item)}`}
            onPress={() => router.push({ pathname: ROUTES.MATCH_DETAILS, params: { id: item.id } } as never)} />
        </View>;
      }}
    />

    <Sheet visible={sheet !== null} onClose={() => setSheet(null)} closeLabel={t("history.close")}
      title={sheet === "range" ? t("history.period") : sheet === "game" ? t("history.game") : sheet === "mode" ? t("history.mode") : t("history.filters")}
      left={sheet && sheet !== "main" ? { label: t("history.filters"), back: true, onPress: () => setSheet("main") } : undefined}
      right={{ label: t("history.done"), bold: true, onPress: () => setSheet(null) }}>
      {sheet === "main" && <>
        <Card>
          <Row first title={t("history.period")} value={rangeLabel(filters.range)} onPress={() => setSheet("range")} />
          <Row title={t("history.game")} value={gameLabel} onPress={() => setSheet("game")} />
          <Row title={t("history.mode")} value={modeLabel} onPress={() => setSheet("mode")} />
        </Card>
        {active > 0 && <Card><Row first title={t("history.clear")} tone="link" end="none" onPress={() => { setFilters(f => ({ ...DEFAULT, result: f.result })); setSheet(null); }} /></Card>}
      </>}
      {sheet === "range" && <Card>
        {["all", "month", ...years].map((range, index) => pick(range, rangeLabel(range), filters.range === range, () => change({ range }), index === 0))}
      </Card>}
      {sheet === "game" && <Card>
        {pick("all", t("history.allGames"), !filters.gameId, () => change({ gameId: undefined }), true)}
        {games.map(game => pick(game.gameId, game.name, filters.gameId === game.gameId, () => change({ gameId: game.gameId }), false, <GameCover uri={game.imageUrl} size={44} />))}
      </Card>}
      {sheet === "mode" && <Card>
        {([undefined, ...MODES] as (Mode | undefined)[]).map((mode, index) => pick(mode ?? "all", mode ? t(`statistics:modes.${mode}`) : t("history.allModes"), filters.mode === mode, () => change({ mode }), index === 0))}
      </Card>}
    </Sheet>
  </>;
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingTop: space.xs, paddingBottom: 32 },
  header: { gap: space.md, marginBottom: space.md },
  scope: { flexDirection: "row", alignItems: "stretch", minHeight: 60 },
  scopeMain: { flex: 1, minWidth: 0, justifyContent: "center", gap: 2, paddingVertical: space.sm, paddingLeft: space.lg, paddingRight: space.md },
  line: { flexDirection: "row", alignItems: "center", gap: 4 },
  shrink: { flexShrink: 1 },
  divider: { width: 1, backgroundColor: colors.line, marginVertical: space.md },
  // The rows of one card, split across list cells so long histories stay virtualised.
  cell: { backgroundColor: colors.card, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line, overflow: "hidden" },
  cellFirst: { borderTopWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  cellLast: { borderBottomWidth: 1, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  result: { color: colors.text },
  footer: { marginTop: space.md },
});
