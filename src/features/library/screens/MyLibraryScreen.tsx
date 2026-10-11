import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
import PrimaryButton from "@/src/components/ui/ClubPrimaryButton";
import SectionCard from "@/src/components/ui/ClubSectionCard";

import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";

import { CollectionSearchBar } from "../components/CollectionSearchBar";
import { CollectionTabs, CollectionTab } from "../components/CollectionTabs";
import { CollectionToolbar } from "../components/CollectionToolbar";
import { CollectionFiltersSheet } from "../components/CollectionFiltersSheet";
import { CollectionSortSheet } from "../components/CollectionSortSheet";
import { ActiveFilterChips } from "../components/ActiveFilterChips";
import { CollectionGridCard } from "../components/CollectionGridCard";
import { CollectionListItem } from "../components/CollectionListItem";
import { CollectionEmptyState } from "../components/CollectionEmptyState";
import { CollectionSkeleton } from "../components/CollectionSkeleton";
import { CollectionGameActionsSheet } from "../components/CollectionGameActionsSheet";
import { CollectionHighlight } from "../components/CollectionHighlight";
import { CollectionFadeIn } from "../components/CollectionFadeIn";
import ManageLibraryEntryModal from "../components/ManageLibraryEntryModal";

import { useLibraryActions } from "../hooks/useLibraryActions";
import { useUserLibrary } from "../hooks/useUserLibrary";
import { usePlayedGames } from "../hooks/usePlayedGames";
import { useViewModePreference } from "../hooks/useViewModePreference";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { UserGameLibrary } from "../types/UserGameLibrary";
import {
  buildCollectionEntries, CollectionEntry, CollectionFilters, EMPTY_FILTERS,
  countActiveFilters, applyFilters, sortEntries, sortOptionsForTab, SortOption,
} from "../utils/collectionHelpers";
import { ROUTES } from "@/src/constants/routes";

export default function MyLibraryScreen() {
  const { t, i18n } = useTranslation("library");
  const { width, fontScale } = useWindowDimensions();
  const { library = [], loading, error, refetch } = useUserLibrary();
  const { playedGames, loading: playedLoading, error: playedError, refetch: refetchPlayed } = usePlayedGames();
  const { removeGame, updateGame } = useLibraryActions();
  const { viewMode, setViewMode } = useViewModePreference();

  const [activeTab, setActiveTab] = useState<CollectionTab>("ALL");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [manageEntry, setManageEntry] = useState<UserGameLibrary | null>(null);
  const [actionsEntry, setActionsEntry] = useState<CollectionEntry | null>(null);

  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  const availableSorts = useMemo(() => sortOptionsForTab(activeTab), [activeTab]);
  const [sort, setSort] = useState<SortOption>(availableSorts[0]);

  // Se mudares de separador e a ordenação atual já não fizer sentido lá, volta à 1ª opção válida
  useEffect(() => {
    if (!availableSorts.includes(sort)) setSort(availableSorts[0]);
  }, [availableSorts, sort]);

  const allEntries = useMemo(
    () => buildCollectionEntries(library, playedGames),
    [library, playedGames]
  );

  const counts = useMemo(() => {
    const owned = library.filter((e) => e.status === GameLibraryStatus.Owned);
    return {
      total: allEntries.length,
      owned: owned.length,
      wishlist: library.filter((e) => e.status === GameLibraryStatus.Wishlist).length,
      played: playedGames.length,
      totalSpent: owned.reduce((sum, e) => sum + (e.pricePaid ?? 0), 0),
    };
  }, [allEntries, library, playedGames]);

  const tabFiltered = useMemo(() => {
    if (activeTab === "ALL") return allEntries;
    if (activeTab === "PLAYED") return allEntries.filter((e) => e.timesPlayed > 0);
    return allEntries.filter((e) => e.status === activeTab);
  }, [allEntries, activeTab]);

  const searchFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tabFiltered;
    return tabFiltered.filter((e) => e.gameName.toLowerCase().includes(query));
  }, [tabFiltered, search]);

  const filterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const visibleEntries = useMemo(() => {
    const filtered = applyFilters(searchFiltered, filters);
    return sortEntries(filtered, sort);
  }, [searchFiltered, filters, sort]);

  const handlePrimaryAction = useCallback(
    async (entry: CollectionEntry) => {
      if (entry.status === GameLibraryStatus.Wishlist) {
        try {
          await updateGame(entry.gameId, GameLibraryStatus.Owned, entry.pricePaid);
          Toast.show({ type: "success", text1: t("ui.added", { name: entry.gameName }) });
        } catch (err) {
          console.error("Erro ao mover para a coleção:", err);
          Toast.show({ type: "error", text1: t("ui.addError") });
        }
        return;
      }

      router.push({ pathname: ROUTES.REGISTER_MATCH, params: { gameId: entry.gameId } } as never);
    },
    [updateGame, t]
  );

  const handleCardPress = useCallback((entry: CollectionEntry) => {
    router.push({ pathname: ROUTES.GAME_DETAILS, params: { id: entry.gameId } });
  }, []);

  const openManageModal = useCallback(
    (entry: CollectionEntry) => {
      if (!entry.libraryEntryId) return;
      const fullEntry = library.find((e) => e.id === entry.libraryEntryId);
      if (fullEntry) setManageEntry(fullEntry);
    },
    [library]
  );

  const handleLongPress = useCallback(
    (entry: CollectionEntry) => openManageModal(entry),
    [openManageModal]
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchPlayed()]);
    } finally {
      setRefreshing(false);
    }
  }

  const isLoading = (loading || playedLoading) && allEntries.length === 0;

  const emptyVariant =
    filterCount > 0 ? "filters" :
      search.trim() ? "search" :
        activeTab === GameLibraryStatus.Wishlist ? "wishlist" :
          activeTab === "PLAYED" ? "played" : "collection";

  const columns = viewMode === "grid" && width >= 360 && fontScale <= 1.25 ? 2 : 1;
  const listHeader = (
    <View>
      <CollectionSearchBar value={search} onChangeText={setSearch} />
      {(error || playedError) && (
        <SectionCard>
          <Text style={styles.errorText} accessibilityRole="alert">{t("toast.loadErrorDescription")}</Text>
          <PrimaryButton title={t("screen.retry")} onPress={() => { void onRefresh(); }} variant="secondary" />
        </SectionCard>
      )}

      <CollectionTabs active={activeTab} onChange={setActiveTab} counts={{ total: counts.total, owned: counts.owned, wishlist: counts.wishlist, played: counts.played }} />
      {activeTab === GameLibraryStatus.Owned && (
        <Text style={styles.spent}>{t("ui.spent")} <Text style={styles.spentValue}>{new Intl.NumberFormat(i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB", { style: "currency", currency: "EUR" }).format(counts.totalSpent)}</Text></Text>
      )}

      <CollectionToolbar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        activeFilterCount={filterCount}
        onFiltersPress={() => setFiltersVisible(true)}
        sort={sort}
        onSortPress={() => setSortVisible(true)}
      />

      <ActiveFilterChips
        filters={filters}
        onChange={setFilters}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
      />

      {activeTab === "ALL" && !search.trim() && filterCount === 0 && (
        <CollectionHighlight
          entries={allEntries}
          onViewGame={handleCardPress}
          onRegisterMatch={handlePrimaryAction}
        />
      )}

    </View>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          key={`${viewMode}-${columns}`}
          data={isLoading ? [] : visibleEntries}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={isLoading ? (
            <View accessibilityLabel={t("common:loading")} accessibilityState={{ busy: true }}>
              <CollectionSkeleton viewMode={viewMode} />
            </View>
          ) : error || playedError ? null : (
            <CollectionEmptyState
              variant={emptyVariant as any}
              onActionPress={
                filterCount > 0 ? () => setFilters(EMPTY_FILTERS) :
                  search.trim() ? () => setSearch("") :
                    () => router.push("/games/search")
              }
            />
          )}
          keyExtractor={(item) => item.gameId}
          numColumns={columns}
          columnWrapperStyle={columns === 2 ? styles.gridColumnWrap : undefined}
          renderItem={({ item, index }) =>
            viewMode === "grid" ? (
              <View style={styles.gridItemWrap}>
                <CollectionFadeIn index={index}>
                  <CollectionGridCard
                    entry={item}
                    onPress={() => handleCardPress(item)}
                    onLongPress={() => handleLongPress(item)}
                    onPrimaryAction={() => handlePrimaryAction(item)}
                    onMenuPress={() => setActionsEntry(item)}
                  />
                </CollectionFadeIn>
              </View>
            ) : (
              <CollectionFadeIn index={index}>
                <CollectionListItem
                  entry={item}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleLongPress(item)}
                  onPrimaryAction={() => handlePrimaryAction(item)}
                  onMenuPress={() => setActionsEntry(item)}
                />
              </CollectionFadeIn>
            )
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </KeyboardAvoidingView>

      {manageEntry?.game && (
        <ManageLibraryEntryModal
          visible
          onClose={() => setManageEntry(null)}
          game={manageEntry.game}
          entry={manageEntry}
        />
      )}

      <CollectionGameActionsSheet
        visible={!!actionsEntry}
        entry={actionsEntry}
        onClose={() => setActionsEntry(null)}
        onEdit={(entry) => openManageModal(entry)}
      />

      <CollectionFiltersSheet
        visible={filtersVisible}
        filters={filters}
        onApply={setFilters}
        onClose={() => setFiltersVisible(false)}
      />

      <CollectionSortSheet
        visible={sortVisible}
        options={availableSorts}
        active={sort}
        onSelect={setSort}
        onClose={() => setSortVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, width: "100%", maxWidth: 680, alignSelf: "center" },
  gridColumnWrap: { gap: theme.space.md },
  gridItemWrap: { flex: 1, marginBottom: theme.space.md },
  listContent: { paddingHorizontal: theme.space.lg, paddingTop: theme.space.sm, paddingBottom: theme.space.xxl },
  spent: { ...theme.text.caption, color: theme.colors.muted, marginBottom: theme.space.sm },
  spentValue: { fontWeight: "600", color: theme.colors.text },
  errorText: { ...theme.text.body, color: theme.colors.muted, marginBottom: theme.space.lg },
});
