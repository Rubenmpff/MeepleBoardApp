/**
 * Game page. The top presents the game: the cover with its own proportions, name and year, the BGG and MeepleBoard
 * ratings apart, the facts sheet, «Registar partida», the library state and «Combinar sessão».
 * Three areas follow; after scrolling, a bar with the name keeps them at hand:
 *   Sobre       — description, «A tua experiência» (matches, your rating, journal, Companhia, campaigns),
 *                 friends who own it and the expansions with your library state.
 *   Como jogar  — official rules and explanation videos, base game first, expansions apart.
 *   Recursos    — 3D models (by category), unboxings and other material.
 * BoardGameGeek data is labelled where it appears, with a link to the original page.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenState from "@/src/components/ui/ScreenState";
import ScreenScroll from "@/src/ui/Screen";
import { Button, Glyph, Section, Segmented } from "@/src/ui/components";
import { colors, isLarge, radius, space, strong, touch, type } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import AddToLibraryModal from "@/src/features/library/components/AddToLibraryModal";
import ManageLibraryEntryModal from "@/src/features/library/components/ManageLibraryEntryModal";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { useLibraryActions } from "@/src/features/library/hooks/useLibraryActions";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { localISO, parseDate } from "@/src/features/statistics/utils/period";
import ResourceArea from "@/src/features/games/resources/components/ResourceArea";
import { useGameResources } from "@/src/features/games/resources/hooks/useGameResources";
import { useResourceLanguage } from "@/src/features/games/resources/hooks/useResourceLanguage";
import resourceService from "@/src/features/games/resources/services/resourceService";
import gameService, { GameFriendOwner } from "../services/gameService";
import GameHero, { GameFacts } from "../components/GameHero";
import GameExperience from "../components/GameExperience";
import GameDurationsSection, { bggDuration } from "@/src/features/games/durations/components/GameDurationsSection";
import GameExperiencesSection from "@/src/features/games/experiences/components/GameExperiencesSection";
import FriendOwners from "../components/FriendOwners";
import GameExpansions from "../components/GameExpansions";
import matchService from "../../matches/services/matchService";
import campaignService from "../../campaigns/services/campaignService";
import { Game } from "../types/Game";
import { MatchDto } from "../../matches/types/MatchForm";
import { Campaign } from "../../campaigns/types/Campaign";

type Area = "about" | "howToPlay" | "resources";
const bggUrl = (bggId: number) => `https://boardgamegeek.com/boardgame/${bggId}`;
// Statistics accept at most this many days per period (API rule).
const MAX_DAYS = 3660;

/** Companhia for one game: from your first match of it to today, or the last 10 years when it goes further back. */
export function companyPeriod(matches: MatchDto[], today = new Date()) {
  const days = matches.map(m => parseDate(m.matchDate.slice(0, 10))).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());
  if (!days.length) return null;
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12);
  const earliest = new Date(end); earliest.setDate(end.getDate() - MAX_DAYS);
  const limited = days[0] < earliest;
  return { start: localISO(limited ? earliest : days[0]), endExclusive: localISO(end), first: localISO(days[0]), limited };
}

export default function GameDetailsScreen() {
  const { t, i18n } = useTranslation("games");
  const { t: libraryT } = useTranslation("library");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { library = [] } = useUserLibrary();
  const { addGame } = useLibraryActions();
  const language = i18n?.language ?? "pt";

  const [game, setGame] = useState<Game | null>(null);
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameError, setGameError] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState(false);
  const [allMatches, setAllMatches] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState(false);
  const [fullDescription, setFullDescription] = useState(false);
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [area, setArea] = useState<Area>("about");
  const [canManage, setCanManage] = useState(false);
  const [friendOwners, setFriendOwners] = useState<GameFriendOwner[] | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState(false);
  // Scrolled: 0 at the top, 1 past the cover (a bar with the name), 2 past the areas (the bar also holds them).
  const [pinned, setPinned] = useState(0);
  const tabsY = useRef(0);
  const offset = useRef(0);
  const scroll = useRef<ScrollView | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const resourceLanguage = useResourceLanguage(language);
  const resources = useGameResources(game?.id, resourceLanguage.language, area !== "about" && resourceLanguage.loaded);

  const fetchGame = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try { setLoading(true); setGameError(false); setGame(await gameService.getById(id)); }
    catch (err) { setGameError(true); console.error("Erro ao carregar jogo", err); }
    finally { setLoading(false); }
  }, [id]);

  const fetchHistory = useCallback(async () => {
    if (!id || !currentUser?.id) { setHistoryLoading(false); return; }
    setHistoryLoading(true); setHistoryError(false);
    try {
      const [historyRes, ratingRes] = await Promise.all([matchService.getHistoryByGame(id), matchService.getUserRatingForGame(id)]);
      setMatches(historyRes); setUserRating(ratingRes);
    } catch (err) { console.error("Erro ao carregar histórico", err); setHistoryError(true); }
    finally { setHistoryLoading(false); }
  }, [id, currentUser?.id]);

  const fetchCampaigns = useCallback(async () => {
    if (!id) { setCampaignsLoading(false); return; }
    setCampaignsLoading(true); setCampaignsError(false);
    try { setCampaigns(await campaignService.getByGame(id)); }
    catch (err) { console.error("Erro ao carregar campanhas", err); setCampaignsError(true); }
    finally { setCampaignsLoading(false); }
  }, [id]);

  const fetchFriends = useCallback(async () => {
    if (!id) { setFriendsLoading(false); return; }
    setFriendsLoading(true); setFriendsError(false);
    try { setFriendOwners((await gameService.getFriendOwners(id)).items); }
    catch (err) { console.error("Erro ao carregar amigos com o jogo", err); setFriendsError(true); }
    finally { setFriendsLoading(false); }
  }, [id]);

  useEffect(() => { fetchGame(); fetchHistory(); fetchCampaigns(); fetchFriends(); }, [fetchGame, fetchHistory, fetchCampaigns, fetchFriends]);
  useEffect(() => { resourceService.canManage().then(setCanManage).catch(() => setCanManage(false)); }, []);

  if (loading || !game || gameError) {
    return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}><ScreenHeader title="" leftAccessibilityLabel={t("ui.back")} /></View>
      <ScreenState loading={loading} error={gameError} message={t(loading ? "ui.loadingGame" : gameError ? "ui.loadError" : "details.notFound")}
        onRetry={gameError ? () => { void fetchGame(); } : undefined} retryLabel={t("ui.retry")} />
    </SafeAreaView>;
  }

  const entry = library.find(e => e.gameId === game.id);
  const statusLabel = entry?.status === GameLibraryStatus.Wishlist ? libraryT("ui.wanted") : entry?.status === GameLibraryStatus.Played ? libraryT("ui.played") : libraryT("ui.owned");
  const openBgg = () => { if (game.bggId) void Linking.openURL(bggUrl(game.bggId)); };
  const back = () => { if (router.canGoBack()) router.back(); else router.replace(ROUTES.HOME as never); };
  const period = companyPeriod(matches);
  const openCompany = () => {
    if (!period) return;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    router.push({ pathname: "/statistics/company", params: { start: period.start, endExclusive: period.endExclusive, timeZone, gameId: game.id, period: "custom",
      ...(period.limited ? { historyFrom: period.first, gameName: game.name } : {}) } } as never);
  };
  const barHeight = insets.top + touch + space.sm;
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
    const next = offset.current > tabsY.current - barHeight + touch ? 2 : offset.current > 140 ? 1 : 0;
    if (next !== pinned) setPinned(next);
  };
  const chooseArea = (next: Area) => {
    setArea(next);
    if (pinned === 2) scroll.current?.scrollTo({ y: Math.max(0, tabsY.current - barHeight - touch - space.md), animated: false });
  };
  const tabs = <Segmented items={(["about", "howToPlay", "resources"] as Area[]).map(key => ({ key, label: t(`details.areas.${key}`) }))} value={area} onChange={chooseArea} />;

  async function add(price?: number, status?: GameLibraryStatus) {
    await addGame(game!, status, price);
    Toast.show({ type: "success", text1: libraryT(status === GameLibraryStatus.Wishlist ? "ui.addedWanted" : "ui.added", { name: game!.name }) });
  }

  const about = <>
    {!!game.description && <Section title={t("details.descriptionTitle")}>
      <View style={styles.description}>
        <Text style={type.body} numberOfLines={fullDescription ? undefined : 4}>{game.description}</Text>
        {game.description.length > 200 && <TouchableOpacity style={styles.more} onPress={() => setFullDescription(v => !v)} accessibilityRole="button">
          <Text style={[type.body, strong, { color: colors.primary }]}>{t(fullDescription ? "details.readLess" : "details.readMore")}</Text></TouchableOpacity>}
        {!!game.bggId && <>
          <View style={styles.sourceLine}><Glyph name="information-outline" size={14} color={colors.muted} /><Text style={[type.micro, styles.flex]}>{t("details.descriptionSource")}</Text></View>
          <TouchableOpacity style={styles.bggLink} onPress={openBgg} accessibilityRole="link" accessibilityLabel={t("details.bgg.open")} accessibilityHint={t("details.bgg.hint")}>
            <Text style={[type.caption, strong, { color: colors.primary }]}>{t("details.bggEntry")}</Text>
            <Glyph name="open-in-new" size={14} color={colors.primary} />
          </TouchableOpacity>
        </>}
      </View>
    </Section>}

    <GameExperience gameName={game.name} language={language} userId={currentUser?.id} matches={matches} historyLoading={historyLoading} historyError={historyError}
      onRetryHistory={() => { void fetchHistory(); }} userRating={userRating} allMatches={allMatches} onToggleMatches={() => setAllMatches(v => !v)}
      campaigns={campaigns} campaignsLoading={campaignsLoading} campaignsError={campaignsError} onRetryCampaigns={() => { void fetchCampaigns(); }}
      allCampaigns={allCampaigns} onToggleCampaigns={() => setAllCampaigns(v => !v)}
      onOpenMatch={matchId => router.push({ pathname: ROUTES.MATCH_DETAILS, params: { id: matchId } } as never)}
      onOpenJournal={matchId => router.push({ pathname: ROUTES.MATCH_JOURNAL, params: { id: matchId } } as never)}
      onOpenCampaign={campaignId => router.push(`/(app)/games/campaigns/${campaignId}`)}
      onNewCampaign={() => router.push(`/(app)/games/campaigns/create?gameId=${game.id}&gameName=${encodeURIComponent(game.name)}`)}
      company={period ? { limited: period.limited, onOpen: openCompany } : undefined} />

    <GameDurationsSection game={game} onOpenDetails={() => router.push({ pathname: ROUTES.GAME_DURATIONS, params: { id: game.id, name: game.name, bgg: bggDuration(game) ?? "" } } as never)} />

    <GameExperiencesSection gameId={game.id} />

    <FriendOwners owners={friendOwners} loading={friendsLoading} error={friendsError} onRetry={() => { void fetchFriends(); }}
      onOpen={userId => router.push({ pathname: ROUTES.USER_PROFILE, params: { id: userId } } as never)} />

    <GameExpansions expansions={game.expansions ?? []} statusOf={gameId => library.find(e => e.gameId === gameId)?.status}
      onOpen={gameId => router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: gameId } } as never)} />
  </>;

  return <SafeAreaView style={styles.screen} edges={["left", "right"]}>
    <ScreenScroll ref={scroll} contentContainerStyle={styles.content} onScroll={onScroll} scrollEventThrottle={32}>
      <View style={styles.top}>
        <GameHero game={game} language={language} onOpenBgg={openBgg} topInset={insets.top} />
        <GameFacts game={game} language={language} onOpenBgg={openBgg} />
        <View style={[styles.actions, large && styles.actionsLarge]}>
          <Button variant="primary" icon="plus" title={t("details.registerMatch")} style={styles.action} onPress={() => router.push({ pathname: ROUTES.REGISTER_MATCH, params: { gameId: game.id } } as never)} />
          {entry
            ? <TouchableOpacity style={[styles.libraryState, styles.action]} onPress={() => setManaging(true)} accessibilityRole="button" accessibilityLabel={t("details.manageLibrary", { status: statusLabel })}>
              <Glyph name="check-circle" size={18} color={colors.primary} />
              <Text style={[type.body, strong, styles.libraryText]} numberOfLines={large ? undefined : 1}>{statusLabel}</Text>
              <Glyph name="chevron-down" size={18} color={colors.primary} />
            </TouchableOpacity>
            : <Button title={t(large ? "details.addToLibrary" : "details.addToLibraryShort")} accessibilityLabel={t("details.addToLibrary")} icon="bookshelf" style={styles.action} onPress={() => setAdding(true)} />}
        </View>
        <TouchableOpacity style={styles.plan} accessibilityRole="button" accessibilityLabel={t("details.planSession")} accessibilityHint={t("details.planSessionHint")}
          onPress={() => router.push({ pathname: ROUTES.SESSION_CREATE, params: { gameId: game.id, gameName: game.name, ...(game.imageUrl ? { gameImageUrl: game.imageUrl } : {}) } } as never)}>
          <Glyph name="calendar-plus" size={18} color={colors.primary} />
          <Text style={[type.body, strong, { color: colors.primary }]}>{t("details.planSession")}</Text>
        </TouchableOpacity>
      </View>

      {/* Measured at the top of the page, where the layout position is the content position. */}
      <View onLayout={event => { if (offset.current === 0) tabsY.current = event.nativeEvent.layout.y; }}>{tabs}</View>

      {area === "about" ? about : <ResourceArea area={area} gameId={game.id} gameName={game.name} data={resources.data} loading={resources.loading || !resourceLanguage.loaded}
        error={resources.error} onRetry={() => { void resources.reload(); }} language={resourceLanguage.language} appLanguage={resourceLanguage.appLanguage}
        onLanguage={resourceLanguage.setLanguage} canManage={canManage} />}
    </ScreenScroll>

    {pinned ? <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.barRow}>
        <TouchableOpacity style={styles.barButton} onPress={back} accessibilityRole="button" accessibilityLabel={t("ui.back")}><Glyph name="chevron-left" size={28} color={colors.primary} /></TouchableOpacity>
        <Text style={[type.head, styles.barTitle]} numberOfLines={1}>{game.name}</Text>
        <View style={styles.barButton} />
      </View>
      {pinned === 2 && <View style={styles.barTabs}>{tabs}</View>}
    </View>
      : <TouchableOpacity style={[styles.floating, { top: insets.top + space.xs }]} onPress={back} accessibilityRole="button" accessibilityLabel={t("ui.back")}>
        <Glyph name="chevron-left" size={26} color={colors.primary} />
      </TouchableOpacity>}

    <AddToLibraryModal visible={adding} game={game} onClose={() => setAdding(false)} onAddToLibrary={add} />
    {managing && entry && <ManageLibraryEntryModal visible game={game} entry={entry} onClose={() => setManaging(false)} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg },
  content: { gap: space.xl },
  top: { gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  actions: { flexDirection: "row", gap: space.sm },
  actionsLarge: { flexDirection: "column" },
  action: { flexGrow: 1, flexBasis: "auto" },
  libraryState: { minHeight: touch, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, paddingHorizontal: space.lg, borderRadius: radius.control, backgroundColor: colors.primarySoft },
  libraryText: { flexShrink: 1, color: colors.primary },
  plan: { minHeight: touch, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, marginTop: -space.xs },
  description: { gap: space.xs, paddingHorizontal: space.lg },
  more: { minHeight: touch, justifyContent: "center", alignSelf: "flex-start" },
  sourceLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  bggLink: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: touch, alignSelf: "flex-start" },
  floating: { position: "absolute", left: space.md, width: touch, height: touch, borderRadius: touch / 2, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center",
    shadowColor: "#30283D", shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  bar: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.line },
  barRow: { flexDirection: "row", alignItems: "center", minHeight: touch, paddingHorizontal: space.xs },
  barButton: { width: touch, height: touch, alignItems: "center", justifyContent: "center" },
  barTitle: { flex: 1, textAlign: "center" },
  barTabs: { paddingHorizontal: space.lg, paddingBottom: space.sm },
});
