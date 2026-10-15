/**
 * Campaigns by status in chips with counts (Ativas, Concluídas, Abandonadas), with search and a game filter;
 * counts follow the search and the filter. Status, search and game are kept per account while the app is open.
 * Inside Jogar the header ＋ creates a campaign; standalone, the screen shows its own button.
 */
import ScreenLayout, { EmbeddedScreen } from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import GameCover from "@/src/components/ui/GameCover";
import { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, FilterChips, Row, SearchField, Glyph } from "@/src/ui/components";
import { ActiveFilters, FilterSheet, ListToolbar, NoResults, OptionGroup } from "@/src/ui/Filters";
import { recall, useAccountId, useRemember } from "@/src/shared/hooks/useAccountMemory";
import { colors, space, type } from "@/src/ui/theme";
import { formatRating } from "@/src/ui/format";
import campaignService from "../services/campaignService";
import { Campaign, CampaignStatus } from "../types/Campaign";

const SECTIONS: { status: CampaignStatus; title: string }[] = [
  { status: "Active", title: "list.sections.active" },
  { status: "Completed", title: "list.sections.completed" },
  { status: "Abandoned", title: "list.sections.abandoned" },
];

export default function CampaignListScreen() {
  const router = useRouter();
  const embedded = useContext(EmbeddedScreen);
  const { t, i18n } = useTranslation("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const account = useAccountId();
  const [status, setStatus] = useState<CampaignStatus>(() => recall<CampaignStatus>(account, "campaigns:status", "Active"));
  const [search, setSearch] = useState(() => recall(account, "campaigns:search", ""));
  const [gameId, setGameId] = useState<string | undefined>(() => recall<string | undefined>(account, "campaigns:game", undefined));
  const [filtersVisible, setFiltersVisible] = useState(false);
  useRemember("campaigns:status", status);
  useRemember("campaigns:search", search);
  useRemember("campaigns:game", gameId);
  const load = useCallback(async (silent = false) => {
    try {
      setLoadError(false);
      if (!silent) setLoading(true);
      setCampaigns(await campaignService.getMine());
    } catch (err) {
      setLoadError(true);
      console.error(t("list.loadError"), err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <ScreenLayout title={t("list.title")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;

  const goCreate = () => router.push("/(app)/games/campaigns/create");
  // The list may report 0 matches for a campaign whose detail has some: show the count only when positive.
  const meta = (c: Campaign) => [t("list.members", { count: c.memberCount }), c.matchCount > 0 ? t("list.matches", { count: c.matchCount }) : null,
    c.averagePersonalRating != null ? `★ ${formatRating(c.averagePersonalRating, i18n.language)}` : null].filter(Boolean).join(" · ");

  const q = search.trim().toLocaleLowerCase();
  const narrowed = campaigns.filter(c => (!q || [c.name, c.gameName].some(v => v?.toLocaleLowerCase().includes(q))) && (!gameId || c.gameId === gameId));
  const gameOptions = [...new Map(campaigns.filter(c => c.gameId).map(c => [c.gameId!, c.gameName ?? ""])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1])).map(([key, label]) => ({ key, label }));
  const gameLabel = gameId ? gameOptions.find(o => o.key === gameId)?.label : undefined;
  const items = narrowed.filter(c => c.status === status);
  const filteredOut = (q || gameId) && narrowed.length === 0;

  return (
    <ScreenLayout title={t("list.title")}>
      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[colors.primary]} tintColor={colors.primary} />}>
        {!embedded && <PrimaryButton title={t("list.new")} icon={<Glyph name="plus" size={20} color={colors.onPrimary} />} onPress={goCreate} />}
        {loadError ? <ScreenState error message={t("list.loadError")} onRetry={() => load()} retryLabel={t("ui.retry")} />
          : campaigns.length === 0 ? <EmptyState title={t("list.emptyTitle")} message={t("list.emptyMessage")}
            action={<PrimaryButton title={t("list.createFirst")} onPress={goCreate} />} />
          : <>
            <SearchField value={search} onChangeText={setSearch} placeholder={t("list.search")} />
            <FilterChips items={SECTIONS.map(({ status: key, title }) => ({ key, label: t(title), count: narrowed.filter(c => c.status === key).length }))} value={status} onChange={setStatus} />
            <ListToolbar filterCount={gameId ? 1 : 0} onFilters={() => setFiltersVisible(true)} />
            <ActiveFilters items={gameLabel ? [{ key: "game", label: `${t("list.gameFilter")}: ${gameLabel}`, onRemove: () => setGameId(undefined) }] : []} onClearAll={() => setGameId(undefined)} />
            {filteredOut ? <NoResults detail={t("list.noneFound")} onAdjust={() => setFiltersVisible(true)} onClear={() => { setSearch(""); setGameId(undefined); }} />
              : items.length === 0 ? <Text style={[type.body, { color: colors.muted }]}>{t("list.emptyStatus")}</Text>
              : <Card>
                {items.map((c, index) => <Row key={c.id} first={index === 0} inset={72} strongTitle title={c.name}
                  lead={<GameCover uri={c.gameImageUrl} size={44} />}
                  subtitle={c.gameName ?? undefined}
                  detail={<Text style={type.caption}>{meta(c)}</Text>}
                  accessibilityLabel={c.name}
                  onPress={() => router.push(`/(app)/games/campaigns/${c.id}` as never)} />)}
              </Card>}
          </>}
      </ScrollView>
      <FilterSheet visible={filtersVisible} value={gameId} empty={undefined} onApply={setGameId} onClose={() => setFiltersVisible(false)} activeCount={v => v ? 1 : 0}>
        {(draft, setDraft) => <OptionGroup title={t("list.gameFilter")} options={gameOptions} selected={draft ? [draft] : []} onChange={next => setDraft(next[0])} />}
      </FilterSheet>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.md },
});
