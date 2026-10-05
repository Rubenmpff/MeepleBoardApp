import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Text,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import {
  router,
  useFocusEffect,
} from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";
import { useGameSuggestions } from "../hooks/useGameSuggestions";
import { useRecentSearches } from "../hooks/useRecentSearches";
import { useHotGames } from "../hooks/useHotGames";
import { useIsOnline } from "../hooks/useIsOnline";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { usePlayedGames } from "@/src/features/library/hooks/usePlayedGames";
import { useLibraryActions } from "@/src/features/library/hooks/useLibraryActions";
import searchResultsCache from "../services/searchResultsCache";

import { GameListItem } from "../components/GameListItem";
import {
  GameSearchFiltersSheet,
  SearchFilters,
  EMPTY_SEARCH_FILTERS,
  countActiveSearchFilters,
  applySearchFilters,
} from "../components/GameSearchFiltersSheet";
import {
  GameSearchSortSheet,
  SearchSortOption,
  SEARCH_SORT_LABELS,
  sortSearchResults,
} from "../components/GameSearchSortSheet";
import AddToLibraryModal from "@/src/features/library/components/AddToLibraryModal";
import ManageLibraryEntryModal from "@/src/features/library/components/ManageLibraryEntryModal";

import { Game } from "../types/Game";
import { GameSuggestion } from "../types/GameSuggestion";
import { normalizeToGame } from "../utils/normalizeToGame";
import { UserGameLibrary } from "@/src/features/library/types/UserGameLibrary";
import gameService from "../services/gameService";

const logPrefix =
  "📚 [GameSearchScreen]";

const logInfo = (
  msg: string,
  data?: any
) =>
  __DEV__ &&
  console.log(
    `${logPrefix} ℹ️ ${msg}`,
    data ?? ""
  );

const logError = (
  msg: string,
  data?: any
) =>
  __DEV__ &&
  console.error(
    `${logPrefix} ❌ ${msg}`,
    data ?? ""
  );

type TypeFilter =
  | "all"
  | "base"
  | "expansion";

const MIN_NETWORK_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 450;
const COVER_REFRESH_DELAY_MS = 1600;
const ENABLE_SILENT_COVER_REFRESH = false;

const EMPTY_GUID =
  "00000000-0000-0000-0000-000000000000";

const isValidLocalId = (
  id?: string | null
): id is string =>
  !!id && id !== EMPTY_GUID;

export default function GameSearchScreen() {
  const { t } =
    useTranslation("games");

  const [query, setQuery] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>("all");

  const [filters, setFilters] =
    useState<SearchFilters>(
      EMPTY_SEARCH_FILTERS
    );

  const [
    filtersVisible,
    setFiltersVisible,
  ] = useState(false);

  const [sort, setSort] =
    useState<SearchSortOption>(
      "relevance"
    );

  const [
    sortVisible,
    setSortVisible,
  ] = useState(false);

  const [
    usedCacheWhileOffline,
    setUsedCacheWhileOffline,
  ] = useState(false);

  const [
    selectedGame,
    setSelected,
  ] = useState<
    Game | GameSuggestion | null
  >(null);

  const [
    addVisible,
    setAddVisible,
  ] = useState(false);

  const [
    manageVisible,
    setManageVisible,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    silentCoverRefreshInFlight,
    setSilentCoverRefreshInFlight,
  ] = useState(false);

  const [
    localPool,
    setLocalPool,
  ] = useState<Game[]>([]);

  /*
   * Proteções do infinite scroll.
   *
   * hasUserScrolledRef:
   * - só fica true depois de uma interação real de scroll;
   * - impede o FlatList de disparar paginação automaticamente só porque
   *   os primeiros resultados não enchem o ecrã.
   *
   * loadMoreInFlightRef:
   * - impede dois pedidos de paginação em simultâneo;
   * - complementa a proteção já existente dentro de useGameSuggestions.
   */
  const hasUserScrolledRef =
    useRef(false);

  const loadMoreInFlightRef =
    useRef(false);

  /*
   * Refresh silencioso das capas:
   * - no máximo uma tentativa por configuração de pesquisa;
   * - generation invalida timers/pedidos quando a pesquisa muda.
   */
  const coverRefreshAttemptedRef =
    useRef(false);

  const coverRefreshGenerationRef =
    useRef(0);

  const isExpansion =
    typeFilter === "all"
      ? undefined
      : typeFilter ===
          "expansion";

  const {
    suggestions,
    loading:
      loadingSuggestions,
    fetchSuggestions,
    hasMore,
    resetSuggestions,
  } = useGameSuggestions(
    "all",
    {
      isExpansion,
      playerCount:
        filters.playerCount,
      minBggRating:
        filters.minBggRating,
      sort,
    }
  );

  const { library } =
    useUserLibrary();

  const { playedGames } =
    usePlayedGames();

  /*
   * Mantém extraData estável entre renders.
   * Um array inline em extraData mudava de referência em todos os renders
   * e podia obrigar a FlatList a atualizar itens sem necessidade.
   */
  const listExtraData =
    useMemo(
      () => ({
        library,
        playedGames,
      }),
      [
        library,
        playedGames,
      ]
    );

  const {
    addGame,
    loading:
      updatingLibrary,
  } = useLibraryActions();

  const {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  } = useRecentSearches();

  const { hotGames } =
    useHotGames();

  const isOnline =
    useIsOnline();

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const searchConfigurationKey =
    useMemo(
      () =>
        JSON.stringify({
          query:
            normalizedQuery,
          typeFilter,
          playerCount:
            filters.playerCount ??
            null,
          minBggRating:
            filters.minBggRating ??
            null,
          sort,
        }),
      [
        normalizedQuery,
        typeFilter,
        filters.playerCount,
        filters.minBggRating,
        sort,
      ]
    );

  /*
   * Cada nova configuração pode fazer uma única tentativa de refresh
   * silencioso das capas.
   */
  useEffect(() => {
    coverRefreshAttemptedRef.current =
      false;

    coverRefreshGenerationRef.current +=
      1;

    setSilentCoverRefreshInFlight(
      false
    );
  }, [searchConfigurationKey]);

  /*
   * Uma nova pesquisa/configuração começa sempre com a paginação desarmada.
   * Assim, onEndReached não pode carregar a página seguinte antes de o
   * utilizador fazer scroll nessa nova lista.
   */
  useEffect(() => {
    hasUserScrolledRef.current =
      false;

    loadMoreInFlightRef.current =
      false;
  }, [
    normalizedQuery,
    typeFilter,
    filters.playerCount,
    filters.minBggRating,
    sort,
  ]);

  /*
   * Pool exclusivamente local/cache.
   *
   * É utilizado para:
   * - pesquisa instantânea com 1 carácter;
   * - fallback offline.
   *
   * Com 2+ caracteres e internet disponível, a lista apresentada vem
   * diretamente do backend, porque é lá que filtros, sort e paginação
   * são aplicados globalmente.
   */
  useEffect(() => {
    let active = true;

    searchResultsCache
      .getAllCachedGames()
      .then((cached) => {
        if (!active) {
          return;
        }

        const fromLibrary: Game[] =
          library
            .map(
              (entry) =>
                entry.game
            )
            .filter(
              (
                game
              ): game is Game =>
                !!game
            );

        const merged =
          new Map<
            string,
            Game
          >();

        [
          ...fromLibrary,
          ...cached,
          ...hotGames,
        ].forEach((game) => {
          const key =
            game.bggId
              ? `bgg-${game.bggId}`
              : game.id
                ? `id-${game.id}`
                : null;

          if (
            key &&
            !merged.has(key)
          ) {
            merged.set(
              key,
              game
            );
          }
        });

        setLocalPool(
          Array.from(
            merged.values()
          ).filter(
            (game) =>
              isValidLocalId(
                game.id
              ) ||
              !game.id
          )
        );
      });

    return () => {
      active = false;
    };
  }, [
    library,
    hotGames,
  ]);

  /*
   * Debounce da pesquisa real.
   *
   * A chamada é refeita automaticamente quando muda:
   * - query;
   * - tipo base/expansão;
   * - jogadores;
   * - rating mínimo;
   * - ordenação.
   *
   * useGameSuggestions inclui estes parâmetros na sua própria chave de
   * request/cache, portanto cada configuração tem paginação independente.
   */
  useEffect(() => {
    if (
      normalizedQuery.length <
      MIN_NETWORK_SEARCH_LENGTH
    ) {
      resetSuggestions();
      return;
    }

    if (!isOnline) {
      setUsedCacheWhileOffline(
        true
      );
      return;
    }

    setUsedCacheWhileOffline(
      false
    );

    const timer =
      setTimeout(() => {
        logInfo(
          `A pesquisar catálogo: "${normalizedQuery}"`,
          {
            typeFilter,
            playerCount:
              filters.playerCount,
            minBggRating:
              filters.minBggRating,
            sort,
          }
        );

        void fetchSuggestions(
          normalizedQuery,
          true
        );
      }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [
    normalizedQuery,
    typeFilter,
    filters.playerCount,
    filters.minBggRating,
    sort,
    isOnline,
    fetchSuggestions,
    resetSuggestions,
  ]);

  const isSameGame =
    useCallback(
      (
        entry: UserGameLibrary,
        game:
          | Game
          | GameSuggestion
      ) => {
        const entryGameId =
          entry.gameId ??
          entry.game?.id ??
          "";

        const entryBggId =
          entry.bggId ??
          entry.game?.bggId ??
          "";

        const gameId =
          "id" in game
            ? game.id ?? ""
            : "";

        const gameBggId =
          game.bggId ?? "";

        return (
          (entryGameId &&
            gameId &&
            entryGameId ===
              gameId) ||
          (entryBggId &&
            gameBggId &&
            entryBggId ===
              gameBggId)
        );
      },
      []
    );

  const findLibraryEntry =
    useCallback(
      (
        game:
          | Game
          | GameSuggestion
      ) =>
        library.find(
          (entry) =>
            isSameGame(
              entry,
              game
            )
        ),
      [
        library,
        isSameGame,
      ]
    );

  const isInLibrary =
    useCallback(
      (
        game:
          | Game
          | GameSuggestion
      ) =>
        !!findLibraryEntry(
          game
        ),
      [findLibraryEntry]
    );

  const findTimesPlayed =
    useCallback(
      (
        game:
          | Game
          | GameSuggestion
      ) => {
        const gameId =
          "id" in game
            ? game.id
            : undefined;

        const played =
          playedGames.find(
            (item) =>
              (gameId &&
                item.gameId ===
                  gameId) ||
              (game.bggId &&
                item.gameId ===
                  String(
                    game.bggId
                  ))
          );

        return (
          played?.timesPlayed ??
          0
        );
      },
      [playedGames]
    );

  useFocusEffect(
    useCallback(() => {
      return () => {
        logInfo(
          "Saindo da tela, limpando estado"
        );

        setQuery("");
        resetSuggestions();
        setSelected(null);
        setAddVisible(false);
        setManageVisible(false);
      };
    }, [resetSuggestions])
  );

  const localMatches =
    useMemo(() => {
      if (
        !normalizedQuery
      ) {
        return [];
      }

      return localPool.filter(
        (game) =>
          game.name
            ?.toLowerCase()
            .startsWith(
              normalizedQuery
            )
      );
    }, [
      localPool,
      normalizedQuery,
    ]);

  /*
   * Filtros locais existem apenas para o modo:
   * - 1 carácter;
   * - offline.
   *
   * Não são utilizados para a pesquisa normal 2+ online.
   */
  const localFallbackList =
    useMemo(() => {
      let result:
        | Game[]
        | (
            | Game
            | GameSuggestion
          )[] =
        localMatches;

      if (
        typeFilter !== "all"
      ) {
        result =
          result.filter(
            (game) =>
              typeFilter ===
              "expansion"
                ? !!game.isExpansion
                : !game.isExpansion
          );
      }

      result =
        applySearchFilters(
          result,
          filters
        );

      return sortSearchResults(
        result,
        sort
      );
    }, [
      localMatches,
      typeFilter,
      filters,
      sort,
    ]);

  /*
   * Índice rápido dos jogos que o frontend já conhece.
   *
   * Não altera a ordem do backend. Serve apenas para enriquecer visualmente
   * os resultados do catálogo (sobretudo a capa) quando já temos esses dados
   * na biblioteca, cache de pesquisas ou jogos em destaque.
   */
  const localByBggId =
    useMemo(() => {
      const map =
        new Map<number, Game>();

      localPool.forEach(
        (game) => {
          if (
            game.bggId != null &&
            !map.has(game.bggId)
          ) {
            map.set(
              game.bggId,
              game
            );
          }
        }
      );

      return map;
    }, [localPool]);

  /*
   * Mantém exatamente a ordem/paginação recebida do backend.
   *
   * Apenas preenche campos em falta com informação que já existe localmente.
   * Isto é especialmente importante para imageUrl, porque muitos registos do
   * GameSearchCatalog ainda não foram enriquecidos pelo /thing do BGG.
   */
  const enrichedSuggestions =
    useMemo(
      () =>
        suggestions.map(
          (suggestion) => {
            if (
              suggestion.bggId ==
              null
            ) {
              return suggestion;
            }

            const local =
              localByBggId.get(
                suggestion.bggId
              );

            if (!local) {
              return suggestion;
            }

            return {
              ...suggestion,
              id:
                isValidLocalId(
                  suggestion.id
                )
                  ? suggestion.id
                  : local.id,
              imageUrl:
                suggestion.imageUrl ||
                local.imageUrl,
              minPlayers:
                suggestion.minPlayers ??
                local.minPlayers,
              maxPlayers:
                suggestion.maxPlayers ??
                local.maxPlayers,
              averageRating:
                suggestion.averageRating ??
                local.averageRating,
              meepleBoardScore:
                suggestion.meepleBoardScore ??
                local.meepleBoardScore,
            };
          }
        ),
      [
        suggestions,
        localByBggId,
      ]
    );

  const activeFilterCount =
    useMemo(
      () =>
        countActiveSearchFilters(
          filters
        ),
      [filters]
    );

  const displayedList =
    useMemo(() => {
      if (
        normalizedQuery.length ===
        0
      ) {
        return [];
      }

      if (
        normalizedQuery.length <
          MIN_NETWORK_SEARCH_LENGTH ||
        !isOnline
      ) {
        return localFallbackList;
      }

      return enrichedSuggestions;
    }, [
      normalizedQuery,
      isOnline,
      localFallbackList,
      enrichedSuggestions,
    ]);

  /*
   * Mantém acesso aos resultados mais recentes dentro do timer sem
   * depender de valores antigos capturados pelo closure.
   */
  const enrichedSuggestionsRef =
    useRef(enrichedSuggestions);

  enrichedSuggestionsRef.current =
    enrichedSuggestions;

  /*
   * O backend enfileira o enriquecimento BGG em background quando uma
   * pesquisa devolve resultados sem capa.
   *
   * A primeira resposta deve continuar imediata. Se houver capas em falta,
   * fazemos UMA nova leitura silenciosa cerca de 1,6 s depois para apanhar
   * os dados já persistidos pelo job.
   *
   * Não existe polling:
   * - uma tentativa por pesquisa/filtros/sort;
   * - sem spinner global;
   * - o timer é cancelado se a pesquisa mudar;
   * - um pedido antigo não altera o estado da pesquisa nova.
   */
  useEffect(() => {
    if (
      !ENABLE_SILENT_COVER_REFRESH ||
      !isOnline ||
      normalizedQuery.length <
        MIN_NETWORK_SEARCH_LENGTH ||
      loadingSuggestions ||
      refreshing ||
      enrichedSuggestions.length ===
        0 ||
      coverRefreshAttemptedRef.current
    ) {
      return;
    }

    const hasMissingCovers =
      enrichedSuggestions.some(
        (game) =>
          !game.imageUrl
      );

    if (!hasMissingCovers) {
      return;
    }

    coverRefreshAttemptedRef.current =
      true;

    const generation =
      coverRefreshGenerationRef.current;

    const timer =
      setTimeout(() => {
        if (
          generation !==
          coverRefreshGenerationRef.current
        ) {
          return;
        }

        const currentSuggestions =
          enrichedSuggestionsRef.current;

        const stillHasMissingCovers =
          currentSuggestions.some(
            (game) =>
              !game.imageUrl
          );

        /*
         * O refresh silencioso serve apenas para atualizar a primeira página.
         * Se o utilizador já carregou páginas adicionais, não fazemos forceReload
         * porque isso voltaria ao offset 0 e podia substituir a lista paginada.
         */
        if (
          !stillHasMissingCovers ||
          currentSuggestions.length > 10 ||
          loadMoreInFlightRef.current
        ) {
          return;
        }

        logInfo(
          "Refresh silencioso para atualizar capas enriquecidas pelo BGG",
          {
            query:
              normalizedQuery,
          }
        );

        setSilentCoverRefreshInFlight(
          true
        );

        void fetchSuggestions(
          normalizedQuery,
          true
        ).finally(() => {
          if (
            generation ===
            coverRefreshGenerationRef.current
          ) {
            setSilentCoverRefreshInFlight(
              false
            );
          }
        });
      }, COVER_REFRESH_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isOnline,
    normalizedQuery,
    loadingSuggestions,
    refreshing,
    enrichedSuggestions,
    fetchSuggestions,
  ]);

  useEffect(() => {
    if (
      displayedList.length ===
        0 ||
      normalizedQuery.length <
        1
    ) {
      return;
    }

    void addSearch(
      query.trim(),
      displayedList[0]
        ?.imageUrl
    );
  }, [
    displayedList,
    normalizedQuery,
    addSearch,
    query,
  ]);

  const handleTextChange =
    useCallback(
      (value: string) => {
        const formattedValue =
          value.length > 0
            ? value.charAt(0).toUpperCase() +
              value.slice(1)
            : "";

        setQuery(formattedValue);
        setUsedCacheWhileOffline(
          false
        );
      },
      []
    );

  const handleTapRecent =
    useCallback(
      (term: string) => {
        setQuery(term);
        setUsedCacheWhileOffline(
          false
        );
      },
      []
    );

  const handleRefresh =
    useCallback(
      async () => {
        if (
          normalizedQuery.length <
            MIN_NETWORK_SEARCH_LENGTH ||
          !isOnline
        ) {
          return;
        }

        setRefreshing(true);

        try {
          logInfo(
            "Refresh lista de resultados"
          );

          await fetchSuggestions(
            normalizedQuery,
            true
          );
        } finally {
          setRefreshing(false);
        }
      },
      [
        normalizedQuery,
        isOnline,
        fetchSuggestions,
      ]
    );

  const handleLoadMore =
    useCallback(async () => {
      if (
        !hasUserScrolledRef.current ||
        loadMoreInFlightRef.current ||
        !isOnline ||
        normalizedQuery.length <
          MIN_NETWORK_SEARCH_LENGTH ||
        loadingSuggestions ||
        !hasMore ||
        refreshing
      ) {
        return;
      }

      /*
       * Desarma imediatamente esta interação.
       * Um único gesto de scroll só pode originar uma página nova.
       */
      hasUserScrolledRef.current =
        false;

      loadMoreInFlightRef.current =
        true;

      try {
        logInfo(
          "Carregar próxima página do catálogo"
        );

        await fetchSuggestions(
          normalizedQuery
        );
      } finally {
        loadMoreInFlightRef.current =
          false;
      }
    }, [
      isOnline,
      normalizedQuery,
      loadingSuggestions,
      hasMore,
      refreshing,
      fetchSuggestions,
    ]);

  const handleUserScroll =
    useCallback(() => {
      if (
        !loadMoreInFlightRef.current
      ) {
        hasUserScrolledRef.current =
          true;
      }
    }, []);

  const handleAddToLibrary =
    async (
      pricePaid?: number
    ) => {
      if (!selectedGame) {
        return;
      }

      const normalized =
        normalizeToGame(
          selectedGame
        );

      logInfo(
        "Adicionando jogo à biblioteca",
        {
          ...normalized,
          pricePaid,
        }
      );

      try {
        await addGame(
          normalized,
          undefined,
          pricePaid &&
            pricePaid > 0
            ? pricePaid
            : undefined
        );

        Haptics
          .notificationAsync(
            Haptics
              .NotificationFeedbackType
              .Success
          )
          .catch(() => {});

        Toast.show({
          type: "success",
          text1:
            `${normalized.name} foi adicionado à tua coleção.`,
        });
      } catch (error) {
        logError(
          "Erro ao adicionar jogo",
          error
        );

        Toast.show({
          type: "error",
          text1:
            "Não foi possível adicionar o jogo.",
        });
      } finally {
        closeAll();
      }
    };

  const closeAll = () => {
    setAddVisible(false);
    setManageVisible(false);
    setSelected(null);
  };

  const ensureImportedId =
    async (
      game:
        | Game
        | GameSuggestion
    ) => {
      if (
        "id" in game &&
        isValidLocalId(
          game.id
        )
      ) {
        return game.id;
      }

      if (game.bggId) {
        const imported =
          await gameService
            .importByBggId(
              game.bggId
            );

        return (
          imported?.id ?? ""
        );
      }

      return "";
    };

  const showInitialContent =
    normalizedQuery.length ===
    0;

  const showFirstPageLoader =
    loadingSuggestions &&
    suggestions.length === 0 &&
    normalizedQuery.length >=
      MIN_NETWORK_SEARCH_LENGTH &&
    isOnline;

  return (
    <SafeAreaView
      style={
        styles.container
      }
      edges={[
        "top",
        "left",
        "right",
        "bottom",
      ]}
    >
      <ScreenHeader
        mode="menu"
        title="Pesquisar jogos"
      />

      <TextInput
        placeholder={t(
          "search.placeholder"
        )}
        value={query}
        onChangeText={
          handleTextChange
        }
        autoCapitalize="sentences"
        style={styles.input}
        placeholderTextColor={
          COLORS.textMuted
        }
      />

      {!isOnline && (
        <View
          style={
            styles.offlineBanner
          }
        >
          <MaterialIcons
            name="cloud-off"
            size={14}
            color="#856404"
          />

          <Text
            style={
              styles.offlineBannerText
            }
          >
            {usedCacheWhileOffline ||
            localMatches.length >
              0
              ? "Resultados guardados · Offline"
              : "Sem ligação à internet — só vês o que já tinhas pesquisado antes."}
          </Text>
        </View>
      )}

      {!showInitialContent && (
        <>
          <View
            style={
              styles.typeFilterRow
            }
          >
            {(
              [
                {
                  key: "all",
                  label: "Todos",
                },
                {
                  key: "base",
                  label:
                    "Jogos base",
                },
                {
                  key:
                    "expansion",
                  label:
                    "Expansões",
                },
              ] as {
                key: TypeFilter;
                label: string;
              }[]
            ).map((option) => (
              <TouchableOpacity
                key={
                  option.key
                }
                style={[
                  styles.typeFilterChip,
                  typeFilter ===
                    option.key &&
                    styles.typeFilterChipActive,
                ]}
                onPress={() =>
                  setTypeFilter(
                    option.key
                  )
                }
                activeOpacity={
                  0.8
                }
              >
                <Text
                  style={[
                    styles.typeFilterText,
                    typeFilter ===
                      option.key &&
                      styles.typeFilterTextActive,
                  ]}
                >
                  {
                    option.label
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={
              styles.toolbarRow
            }
          >
            <TouchableOpacity
              style={
                styles.toolbarBtn
              }
              onPress={() =>
                setFiltersVisible(
                  true
                )
              }
              activeOpacity={
                0.8
              }
            >
              <MaterialIcons
                name="tune"
                size={15}
                color={
                  COLORS.onBackground
                }
              />

              <Text
                style={
                  styles.toolbarBtnText
                }
              >
                Filtros
              </Text>

              {activeFilterCount >
                0 && (
                <View
                  style={
                    styles.badge
                  }
                >
                  <Text
                    style={
                      styles.badgeText
                    }
                  >
                    {
                      activeFilterCount
                    }
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.toolbarBtnFlex
              }
              onPress={() =>
                setSortVisible(
                  true
                )
              }
              activeOpacity={
                0.8
              }
            >
              <Text
                style={
                  styles.toolbarBtnText
                }
                numberOfLines={
                  1
                }
              >
                Ordenar:{" "}
                {
                  SEARCH_SORT_LABELS[
                    sort
                  ]
                }
              </Text>

              <MaterialIcons
                name="expand-more"
                size={16}
                color={
                  COLORS.onBackground
                }
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {showInitialContent &&
        recentSearches.length >
          0 && (
          <View
            style={
              styles.recentBox
            }
          >
            <View
              style={
                styles.recentHeaderRow
              }
            >
              <Text
                style={
                  styles.recentHeader
                }
              >
                Pesquisas
                recentes
              </Text>

              <TouchableOpacity
                onPress={
                  clearSearches
                }
              >
                <Text
                  style={
                    styles.recentClear
                  }
                >
                  Limpar
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.recentChipsRow
              }
            >
              {recentSearches.map(
                (
                  entry,
                  index
                ) => (
                  <TouchableOpacity
                    key={`recent-${index}-${entry.term}`}
                    style={
                      styles.recentCard
                    }
                    onPress={() =>
                      handleTapRecent(
                        entry.term
                      )
                    }
                    onLongPress={() =>
                      removeSearch(
                        entry.term
                      )
                    }
                    activeOpacity={
                      0.75
                    }
                  >
                    {entry.imageUrl ? (
                      <Image
                        source={{
                          uri:
                            entry.imageUrl,
                        }}
                        style={
                          styles.recentCardImg
                        }
                        transition={
                          200
                        }
                      />
                    ) : (
                      <View
                        style={[
                          styles.recentCardImg,
                          styles.recentCardImgPlaceholder,
                        ]}
                      >
                        <MaterialIcons
                          name="sports-esports"
                          size={
                            26
                          }
                          color={
                            COLORS.primary
                          }
                        />
                      </View>
                    )}

                    <Text
                      style={
                        styles.recentCardText
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {
                        entry.term
                      }
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        )}

      {showInitialContent &&
        hotGames.length >
          0 && (
          <View
            style={
              styles.recentBox
            }
          >
            <Text
              style={
                styles.recentHeader
              }
            >
              🔥 Em destaque
              no BGG
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.recentChipsRow
              }
            >
              {hotGames
                .slice(0, 15)
                .map(
                  (
                    game,
                    index
                  ) => (
                    <TouchableOpacity
                      key={`hot-${index}-${game.bggId ?? game.id ?? "x"}`}
                      style={
                        styles.recentCard
                      }
                      onPress={() =>
                        handleTapRecent(
                          game.name
                        )
                      }
                      activeOpacity={
                        0.75
                      }
                    >
                      {game.imageUrl ? (
                        <Image
                          source={{
                            uri:
                              game.imageUrl,
                          }}
                          style={
                            styles.recentCardImg
                          }
                          transition={
                            200
                          }
                        />
                      ) : (
                        <View
                          style={[
                            styles.recentCardImg,
                            styles.recentCardImgPlaceholder,
                          ]}
                        >
                          <MaterialIcons
                            name="sports-esports"
                            size={
                              26
                            }
                            color={
                              COLORS.primary
                            }
                          />
                        </View>
                      )}

                      <Text
                        style={
                          styles.recentCardText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          game.name
                        }
                      </Text>
                    </TouchableOpacity>
                  )
                )}
            </ScrollView>
          </View>
        )}

      {showFirstPageLoader ? (
        <View
          style={
            styles.firstPageLoader
          }
        >
          <ActivityIndicator
            size="large"
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.searchingText
            }
          >
            {t(
              "search.searching"
            )}
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            displayedList
          }
          extraData={
            listExtraData
          }
          keyExtractor={(
            item,
            index
          ) =>
            item.bggId !=
            null
              ? `bgg-${item.bggId}`
              : item.id !=
                  null
                ? `id-${item.id}`
                : `temp-${index}-${item.name}`
          }
          renderItem={({
            item,
          }) => {
            const libEntry =
              findLibraryEntry(
                item
              );

            return (
              <GameListItem
                game={item}
                inLibrary={
                  !!libEntry
                }
                libraryStatus={
                  libEntry?.status
                }
                timesPlayed={
                  findTimesPlayed(
                    item
                  )
                }
                onPress={async () => {
                  try {
                    setRefreshing(
                      true
                    );

                    const localId =
                      await ensureImportedId(
                        item
                      );

                    if (
                      !localId
                    ) {
                      Alert.alert(
                        t(
                          "search.openDetailsErrorTitle"
                        ),
                        t(
                          "search.openDetailsErrorDescription"
                        )
                      );

                      return;
                    }

                    router.push({
                      pathname:
                        ROUTES.GAME_DETAILS,
                      params: {
                        id:
                          localId,
                      },
                    });
                  } finally {
                    setRefreshing(
                      false
                    );
                  }
                }}
                onAdd={async () => {
                  try {
                    setRefreshing(
                      true
                    );

                    const localId =
                      await ensureImportedId(
                        item
                      );

                    if (
                      !localId
                    ) {
                      Alert.alert(
                        t(
                          "search.importErrorTitle"
                        ),
                        t(
                          "search.importErrorDescription"
                        )
                      );

                      return;
                    }

                    setSelected({
                      ...item,
                      id:
                        localId,
                    });

                    setAddVisible(
                      true
                    );
                  } catch (error) {
                    logError(
                      "Erro ao preparar adição",
                      error
                    );
                  } finally {
                    setRefreshing(
                      false
                    );
                  }
                }}
                onManageLibrary={() => {
                  setSelected(
                    item
                  );

                  setManageVisible(
                    true
                  );
                }}
              />
            );
          }}
          refreshing={
            refreshing
          }
          onRefresh={
            handleRefresh
          }
          onScrollBeginDrag={
            handleUserScroll
          }
          onMomentumScrollBegin={
            handleUserScroll
          }
          onEndReached={
            handleLoadMore
          }
          onEndReachedThreshold={
            0.25
          }
          contentContainerStyle={{
            paddingBottom: 40,
            flexGrow: 1,
          }}
          scrollEventThrottle={
            16
          }
          initialNumToRender={
            10
          }
          removeClippedSubviews={
            false
          }
          ListFooterComponent={
            loadingSuggestions &&
            !silentCoverRefreshInFlight &&
            displayedList.length >
              0 ? (
              <ActivityIndicator
                style={{
                  marginVertical:
                    16,
                }}
                color={
                  COLORS.primary
                }
              />
            ) : null
          }
          ListEmptyComponent={
            normalizedQuery.length >=
              1 &&
            !loadingSuggestions ? (
              <View
                style={
                  styles.emptyBox
                }
              >
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  {!isOnline
                    ? "Sem ligação à internet.\nLiga-te à internet para pesquisar novos jogos."
                    : normalizedQuery.length <
                        MIN_NETWORK_SEARCH_LENGTH
                      ? "Escreve mais uma letra para pesquisar o catálogo completo."
                      : t(
                          "search.empty"
                        )}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {selectedGame &&
        !isInLibrary(
          selectedGame
        ) &&
        addVisible && (
          <AddToLibraryModal
            visible
            onClose={
              closeAll
            }
            game={
              selectedGame
            }
            onAddToLibrary={
              handleAddToLibrary
            }
          />
        )}

      {selectedGame &&
        isInLibrary(
          selectedGame
        ) &&
        manageVisible && (
          <ManageLibraryEntryModal
            visible
            onClose={
              closeAll
            }
            game={
              selectedGame
            }
          />
        )}

      <GameSearchFiltersSheet
        visible={
          filtersVisible
        }
        filters={
          filters
        }
        onApply={
          setFilters
        }
        onClose={() =>
          setFiltersVisible(
            false
          )
        }
      />

      <GameSearchSortSheet
        visible={
          sortVisible
        }
        active={sort}
        onSelect={
          setSort
        }
        onClose={() =>
          setSortVisible(
            false
          )
        }
      />

      {(refreshing ||
        updatingLibrary) && (
        <Modal
          transparent
          animationType="fade"
        >
          <View
            style={
              styles.overlay
            }
          >
            <ActivityIndicator
              size="large"
              color={
                COLORS.primary
              }
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.background,
      padding: 16,
    },

    input: {
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 10,
      backgroundColor:
        COLORS.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },

    offlineBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor:
        "#fff8e1",
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        "#ffe082",
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginBottom: 12,
    },

    offlineBannerText: {
      fontSize: 12,
      color: "#856404",
      fontWeight: "600",
      flex: 1,
    },

    typeFilterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },

    typeFilterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    typeFilterChipActive: {
      backgroundColor:
        COLORS.primary,
      borderColor:
        COLORS.primary,
    },

    typeFilterText: {
      fontSize: 12,
      fontWeight: "700",
      color:
        COLORS.onBackground,
    },

    typeFilterTextActive: {
      color: "#fff",
    },

    toolbarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },

    toolbarBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor:
        COLORS.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    toolbarBtnFlex: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 4,
      backgroundColor:
        COLORS.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    toolbarBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color:
        COLORS.onBackground,
    },

    badge: {
      backgroundColor:
        COLORS.primary,
      borderRadius: 999,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 3,
    },

    badgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#fff",
    },

    firstPageLoader: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingBottom: 80,
    },

    emptyBox: {
      alignItems: "center",
      marginTop: 40,
      paddingHorizontal: 24,
    },

    emptyText: {
      color:
        COLORS.textMuted,
      textAlign: "center",
    },

    recentBox: {
      marginBottom: 16,
    },

    recentHeaderRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 10,
    },

    recentHeader: {
      fontSize: 13,
      fontWeight: "700",
      color:
        COLORS.textMuted,
      marginBottom: 10,
    },

    recentClear: {
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.primary,
    },

    recentChipsRow: {
      flexGrow: 0,
    },

    recentCard: {
      alignItems: "center",
      width: 76,
      marginRight: 12,
    },

    recentCardImg: {
      width: 68,
      height: 68,
      borderRadius: 14,
      backgroundColor:
        "#eee",
      marginBottom: 6,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 5,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      elevation: 2,
    },

    recentCardImgPlaceholder:
      {
        alignItems: "center",
        justifyContent:
          "center",
      },

    recentCardText: {
      fontSize: 12,
      color:
        COLORS.onBackground,
      fontWeight: "600",
      textAlign: "center",
    },

    searchingText: {
      textAlign: "center",
      color: COLORS.primary,
      fontStyle: "italic",
      marginTop: 12,
      fontSize: 14,
    },

    overlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.3)",
      justifyContent:
        "center",
      alignItems: "center",
    },
  });
