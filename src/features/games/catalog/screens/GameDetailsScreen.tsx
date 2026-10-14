/**
 * Game page. Always at hand, in a compact top: the cover, the facts, «Registar partida» and the library state.
 * Three areas:
 *   Sobre       — ratings (BGG and MeepleBoard; mine apart), friends who have it, description, my matches and campaigns.
 *   Como jogar  — official rules, explanation videos and full playthroughs.
 *   Recursos    — 3D models (by category), unboxings and other material.
 * BoardGameGeek data is labelled where it appears, with a link to the original page.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import ScreenState from "@/src/components/ui/ScreenState";
import ScreenScroll from "@/src/ui/Screen";
import { Button, Card, Glyph, Row, Section, Segmented } from "@/src/ui/components";
import { colors, isLarge, radius, space, strong, touch, type } from "@/src/ui/theme";
import { formatDate, formatRating } from "@/src/ui/format";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import AddToLibraryModal from "@/src/features/library/components/AddToLibraryModal";
import ManageLibraryEntryModal from "@/src/features/library/components/ManageLibraryEntryModal";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { useLibraryActions } from "@/src/features/library/hooks/useLibraryActions";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import ResourceArea from "@/src/features/games/resources/components/ResourceArea";
import { useGameResources } from "@/src/features/games/resources/hooks/useGameResources";
import { useResourceLanguage } from "@/src/features/games/resources/hooks/useResourceLanguage";
import resourceService from "@/src/features/games/resources/services/resourceService";
import { matchResultText } from "../../sessions/utils/matchResultKey";
import gameService, { GameFriendOwner } from "../services/gameService";
import GameRatings, { JournalTarget } from "../components/GameRatings";
import FriendOwners from "../components/FriendOwners";
import matchService from "../../matches/services/matchService";
import campaignService from "../../campaigns/services/campaignService";
import { Game } from "../types/Game";
import { MatchDto } from "../../matches/types/MatchForm";
import { Campaign } from "../../campaigns/types/Campaign";

const PREVIEW = 3;
type Area = "about" | "howToPlay" | "resources";
const bggUrl = (bggId: number) => `https://boardgamegeek.com/boardgame/${bggId}`;

export default function GameDetailsScreen() {
  const { t, i18n } = useTranslation("games");
  const { t: libraryT } = useTranslation("library");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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

  const header = <View style={styles.header}><ScreenHeader title="" leftAccessibilityLabel={t("ui.back")} /></View>;
  if (loading || !game || gameError) {
    return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {header}
      <ScreenState loading={loading} error={gameError} message={t(loading ? "ui.loadingGame" : gameError ? "ui.loadError" : "details.notFound")}
        onRetry={gameError ? () => { void fetchGame(); } : undefined} retryLabel={t("ui.retry")} />
    </SafeAreaView>;
  }

  const entry = library.find(e => e.gameId === game.id);
  const statusLabel = entry?.status === GameLibraryStatus.Wishlist ? libraryT("ui.wanted") : entry?.status === GameLibraryStatus.Played ? libraryT("ui.played") : libraryT("ui.owned");
  const facts = [game.isExpansion ? t("ui.expansion") : t("ui.baseGame"), game.yearPublished ? String(game.yearPublished) : null,
    game.minPlayers && game.maxPlayers ? t("ui.playersCount", { range: game.minPlayers === game.maxPlayers ? game.minPlayers : `${game.minPlayers}–${game.maxPlayers}` }) : null,
    game.averageWeight ? t("details.weight", { value: formatRating(game.averageWeight, language) }) : null,
    game.isCooperative ? t("details.cooperativeMode") : null, game.supportsSoloMode ? t("details.soloMode") : null].filter(Boolean).join(" · ");
  const shown = allMatches ? matches : matches.slice(0, PREVIEW);
  // «A tua avaliação» is the average of your match ratings: point at the next match to rate, or the latest journal.
  const rated = matches.filter(m => m.personalRating != null).length;
  const toRate = matches.find(m => m.id && m.personalRating == null && m.journalStatus !== "Closed");
  const latest = matches.find(m => m.id);
  const journal: JournalTarget | null = toRate ? { id: toRate.id!, date: toRate.matchDate, pending: true } : latest ? { id: latest.id!, date: latest.matchDate, pending: false } : null;
  const openBgg = () => { if (game.bggId) void Linking.openURL(bggUrl(game.bggId)); };

  async function add(price?: number, status?: GameLibraryStatus) {
    await addGame(game!, status, price);
    Toast.show({ type: "success", text1: libraryT(status === GameLibraryStatus.Wishlist ? "ui.addedWanted" : "ui.added", { name: game!.name }) });
  }

  const about = <>
    <GameRatings game={game} language={language} userRating={userRating} ratedMatches={rated} journal={journal} personalState={historyLoading ? "loading" : historyError ? "error" : "ready"}
      onOpenJournal={matchId => router.push({ pathname: ROUTES.MATCH_JOURNAL, params: { id: matchId } } as never)} />

    <FriendOwners owners={friendOwners} loading={friendsLoading} error={friendsError} onRetry={() => { void fetchFriends(); }}
      onOpen={userId => router.push({ pathname: ROUTES.USER_PROFILE, params: { id: userId } } as never)} />

    <Section title={t("details.descriptionTitle")}>
      <Card padded style={styles.description}>
        {game.description ? <>
          <Text style={type.body} numberOfLines={fullDescription ? undefined : 6}>{game.description}</Text>
          {game.description.length > 280 && <TouchableOpacity style={styles.more} onPress={() => setFullDescription(v => !v)} accessibilityRole="button">
            <Text style={[type.body, strong, { color: colors.primary }]}>{t(fullDescription ? "details.readLess" : "details.readMore")}</Text></TouchableOpacity>}
          {!!game.bggId && <Text style={type.caption}>{t("details.descriptionSource")}</Text>}
        </> : <Text style={[type.body, styles.muted]}>{t("details.descriptionEmpty")}</Text>}
      </Card>
    </Section>

    <Section title={t("details.yourMatches")} note={matches.length ? String(matches.length) : undefined}>
      {historyLoading || historyError ? <Card><ScreenState loading={historyLoading} error={historyError} message={t(historyLoading ? "ui.loadingHistory" : "ui.loadError")}
        onRetry={historyError ? () => { void fetchHistory(); } : undefined} retryLabel={t("ui.retry")} /></Card>
        : matches.length === 0 ? <Card padded><Text style={[type.body, styles.muted]}>{t("details.historyEmpty")}</Text></Card>
        : <Card>
          {shown.map((m, i) => {
            const extra = [m.isSoloGame ? t("details.solo") : null, m.durationInMinutes ? t("details.minutesShort", { count: m.durationInMinutes }) : null, m.location || null,
              m.personalRating != null ? `★ ${formatRating(m.personalRating, language)}` : null].filter(Boolean).join(" · ");
            return <Row key={m.id ?? i} first={i === 0} title={formatDate(m.matchDate, language)} accessibilityLabel={`${formatDate(m.matchDate, language)}. ${matchResultText(m, (key, options) => t(`matches:${key}`, options))}`}
              detail={<>
                <Text style={type.caption}>{matchResultText(m, (key, options) => t(`matches:${key}`, options))}</Text>
                {!!extra && <Text style={type.caption}>{extra}</Text>}
                {!!m.personalNotes && <Text style={type.body} numberOfLines={3}>{m.personalNotes}</Text>}
                {!!m.tags && <Text style={type.caption}>{m.tags.split(",").map(tag => `#${tag.trim()}`).join("  ")}</Text>}
              </>}
              onPress={m.id ? () => router.push({ pathname: ROUTES.MATCH_DETAILS, params: { id: m.id } } as never) : undefined} />;
          })}
          {matches.length > PREVIEW && <Row title={t(allMatches ? "details.showFewer" : "details.showAllMatches", { count: matches.length })} tone="link" end={allMatches ? "collapse" : "expand"} onPress={() => setAllMatches(v => !v)} />}
        </Card>}
    </Section>

    <Section title={t("details.tabs.campaigns")} note={campaigns.length ? String(campaigns.length) : undefined}>
      <Card>
        {campaignsLoading || campaignsError ? <ScreenState loading={campaignsLoading} error={campaignsError} message={t(campaignsLoading ? "ui.loadingCampaigns" : "ui.loadError")}
          onRetry={campaignsError ? () => { void fetchCampaigns(); } : undefined} retryLabel={t("ui.retry")} />
          : (allCampaigns ? campaigns : campaigns.slice(0, PREVIEW)).map((c, i) => <Row key={c.id} first={i === 0} strongTitle title={c.name} accessibilityLabel={c.name}
            subtitle={[c.status === "Active" ? t("details.campaignStatus.active") : c.status === "Completed" ? t("details.campaignStatus.completed") : t("details.campaignStatus.abandoned"),
              t("details.members", { count: c.memberCount }), t("details.matches", { count: c.matchCount }),
              c.averagePersonalRating ? `★ ${formatRating(c.averagePersonalRating, language)}` : null].filter(Boolean).join(" · ")}
            detail={c.notes ? <Text style={type.caption} numberOfLines={2}>{c.notes}</Text> : undefined}
            onPress={() => router.push(`/(app)/games/campaigns/${c.id}`)} />)}
        {campaigns.length > PREVIEW && <Row title={t(allCampaigns ? "details.showFewer" : "details.showAllCampaigns", { count: campaigns.length })} tone="link" end={allCampaigns ? "collapse" : "expand"} onPress={() => setAllCampaigns(v => !v)} />}
        {!campaignsLoading && !campaignsError && campaigns.length === 0 && <Text style={[type.body, styles.muted, styles.pad]}>{t("details.campaignsEmptyShort")}</Text>}
        <Row title={t("details.newCampaign")} tone="link"
          onPress={() => router.push(`/(app)/games/campaigns/create?gameId=${game.id}&gameName=${encodeURIComponent(game.name)}`)} />
      </Card>
    </Section>
  </>;

  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
    {header}
    <ScreenScroll contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.cover}>
          {game.imageUrl ? <Image source={{ uri: game.imageUrl }} style={styles.image} resizeMode="cover" accessible={false} />
            : <Glyph name="dice-5" size={36} color={colors.icon} />}
        </View>
        <View style={styles.heroText}>
          <Text style={type.title} accessibilityRole="header">{game.name}</Text>
          {!!facts && <Text style={type.caption}>{facts}</Text>}
          {!!game.bggId && <TouchableOpacity style={styles.source} onPress={openBgg} accessibilityRole="link" accessibilityLabel={t("details.bgg.open")} accessibilityHint={t("details.bgg.hint")}>
            <Text style={[type.caption, styles.link]}>{t("details.bgg.source")}</Text>
            <Glyph name="open-in-new" size={14} color={colors.primary} />
          </TouchableOpacity>}
        </View>
      </View>

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

      <Segmented items={(["about", "howToPlay", "resources"] as Area[]).map(key => ({ key, label: t(`details.areas.${key}`) }))} value={area} onChange={setArea} />

      {area === "about" ? about : <ResourceArea area={area} gameId={game.id} gameName={game.name} data={resources.data} loading={resources.loading || !resourceLanguage.loaded}
        error={resources.error} onRetry={() => { void resources.reload(); }} language={resourceLanguage.language} appLanguage={resourceLanguage.appLanguage}
        onLanguage={resourceLanguage.setLanguage} canManage={canManage} />}
    </ScreenScroll>

    <AddToLibraryModal visible={adding} game={game} onClose={() => setAdding(false)} onAddToLibrary={add} />
    {managing && entry && <ManageLibraryEntryModal visible game={game} entry={entry} onClose={() => setManaging(false)} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg },
  content: { paddingTop: space.xs },
  hero: { flexDirection: "row", gap: space.md, alignItems: "center" },
  cover: { width: 72, height: 72, borderRadius: radius.control, backgroundColor: colors.hero, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  heroText: { flex: 1, minWidth: 0, gap: 2 },
  source: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: touch, alignSelf: "flex-start", marginBottom: -space.sm },
  link: { color: colors.primary, fontWeight: "600" },
  actions: { flexDirection: "row", gap: space.sm, marginTop: -space.xs },
  actionsLarge: { flexDirection: "column" },
  action: { flexGrow: 1, flexBasis: "auto" },
  libraryState: { minHeight: touch, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, paddingHorizontal: space.lg, borderRadius: radius.control, backgroundColor: colors.primarySoft },
  libraryText: { flexShrink: 1, color: colors.primary },
  description: { gap: space.sm },
  muted: { color: colors.muted },
  pad: { padding: space.lg, paddingBottom: space.sm },
  more: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
});
