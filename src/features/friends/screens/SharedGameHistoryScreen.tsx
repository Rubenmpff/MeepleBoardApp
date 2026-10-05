/**
 * SharedGameHistoryScreen.tsx
 *
 * Histórico de partidas de UM jogo específico entre mim e um amigo.
 *
 * "Partidas" e "Estatísticas" são separadores do mesmo ecrã.
 * Trocar de separador não cria uma nova rota nem acrescenta uma
 * entrada ao histórico de navegação.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";

import {
  getSharedMatchesForGame,
  SharedMatchDetail,
} from "../services/friendshipService";

type ActiveTab =
  | "matches"
  | "stats";

export default function SharedGameHistoryScreen() {
  const { id, gameId } =
    useLocalSearchParams<{
      id: string;
      gameId: string;
    }>();

  const router = useRouter();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ActiveTab>(
      "matches"
    );

  const [
    matches,
    setMatches,
  ] = useState<
    SharedMatchDetail[] | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const load =
    useCallback(
      async (
        silent = false
      ) => {
        if (
          !id ||
          !gameId
        ) {
          return;
        }

        if (!silent) {
          setLoading(true);
        }

        setError(null);

        try {
          const data =
            await getSharedMatchesForGame(
              id,
              gameId
            );

          const sorted =
            [
              ...(data ??
                []),
            ].sort(
              (
                a,
                b
              ) =>
                new Date(
                  b.matchDate
                ).getTime() -
                new Date(
                  a.matchDate
                ).getTime()
            );

          setMatches(
            sorted
          );
        } catch {
          setError(
            "Não foi possível carregar o histórico."
          );
        } finally {
          setLoading(
            false
          );
          setRefreshing(
            false
          );
        }
      },
      [id, gameId]
    );

  useEffect(() => {
    void load();
  }, [load]);

  const list =
    useMemo(
      () =>
        matches ??
        [],
      [matches]
    );

  const stats =
    useMemo(
      () =>
        calculateStats(
          list
        ),
      [list]
    );

  const gameName =
    list[0]
      ?.gameName ??
    "Histórico em conjunto";

  const gameImage =
    list.find(
      (match) =>
        !!match.imageUrl
    )?.imageUrl ??
    null;

  const lastPlayed =
    list[0]
      ?.matchDate
      ? formatShortDate(
          list[0]
            .matchDate
        )
      : "—";

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
        edges={[
          "top",
          "bottom",
          "left",
          "right",
        ]}
      >
        <ActivityIndicator
          size="large"
          color={
            COLORS.primary
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          A carregar
          histórico...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
        edges={[
          "top",
          "bottom",
          "left",
          "right",
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color={
            COLORS.error
          }
        />

        <Text
          style={
            styles.errorTitle
          }
        >
          Ocorreu um erro
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

        <TouchableOpacity
          style={
            styles.retryButton
          }
          onPress={() =>
            void load()
          }
          activeOpacity={
            0.85
          }
        >
          <Text
            style={
              styles.retryText
            }
          >
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.screen
      }
      edges={[
        "top",
        "bottom",
        "left",
        "right",
      ]}
    >
      <FlatList
        data={
          activeTab ===
          "matches"
            ? list
            : []
        }
        keyExtractor={(
          item
        ) =>
          item.matchId
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() => {
              setRefreshing(
                true
              );
              void load(
                true
              );
            }}
            colors={[
              COLORS.primary,
            ]}
          />
        }
        ListHeaderComponent={
          <View>
            <ScreenHeader
              mode="back"
              title="Histórico do jogo"
            />

            <GameHeader
              gameName={
                gameName
              }
              gameImage={
                gameImage
              }
              matchesCount={
                list.length
              }
              totalMinutes={
                stats.totalMinutes
              }
            />

            <GameTabs
              activeTab={
                activeTab
              }
              onChange={
                setActiveTab
              }
            />

            <View
              style={
                styles.summaryStrip
              }
            >
              <SummaryMetric
                value={
                  list.length
                }
                label="partidas"
              />

              <SummaryMetric
                value={duration(
                  stats.totalMinutes
                )}
                label="tempo total"
              />

              <SummaryMetric
                value={
                  lastPlayed
                }
                label="última"
              />
            </View>

            {activeTab ===
            "matches" ? (
              list.length >
              0 ? (
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Partidas
                  </Text>

                  <Text
                    style={
                      styles.sectionCount
                    }
                  >
                    {
                      list.length
                    }{" "}
                    registo
                    {list.length ===
                    1
                      ? ""
                      : "s"}
                  </Text>
                </View>
              ) : null
            ) : (
              <StatsContent
                stats={
                  stats
                }
              />
            )}
          </View>
        }
        renderItem={({
          item,
        }) => (
          <MatchCard
            item={item}
            onPress={() =>
              router.push(
                {
                  pathname:
                    ROUTES.MATCH_DETAILS,
                  params: {
                    id: item.matchId,
                  },
                } as never
              )
            }
          />
        )}
        ListEmptyComponent={
          activeTab ===
          "matches" ? (
            <MatchesEmptyState />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function GameHeader({
  gameName,
  gameImage,
  matchesCount,
  totalMinutes,
}: {
  gameName: string;
  gameImage:
    | string
    | null;
  matchesCount: number;
  totalMinutes: number;
}) {
  return (
    <View
      style={
        styles.gameHeader
      }
    >
      {gameImage ? (
        <Image
          source={{
            uri: gameImage,
          }}
          style={
            styles.gameCover
          }
        />
      ) : (
        <View
          style={[
            styles.gameCover,
            styles.gameCoverPlaceholder,
          ]}
        >
          <Ionicons
            name="game-controller-outline"
            size={28}
            color={
              COLORS.primary
            }
          />
        </View>
      )}

      <View
        style={
          styles.gameHeaderInfo
        }
      >
        <Text
          style={
            styles.title
          }
          numberOfLines={
            2
          }
        >
          {gameName}
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Histórico em
          conjunto
        </Text>

        <View
          style={
            styles.quickMetaRow
          }
        >
          <QuickMeta
            icon="dice-outline"
            label={`${matchesCount} ${
              matchesCount ===
              1
                ? "partida"
                : "partidas"
            }`}
          />

          <QuickMeta
            icon="time-outline"
            label={duration(
              totalMinutes
            )}
          />
        </View>
      </View>
    </View>
  );
}

function GameTabs({
  activeTab,
  onChange,
}: {
  activeTab: ActiveTab;
  onChange: (
    tab: ActiveTab
  ) => void;
}) {
  return (
    <View
      style={
        styles.segmented
      }
    >
      <TouchableOpacity
        style={[
          styles.segmentButton,
          activeTab ===
            "matches" &&
            styles.segmentButtonActive,
        ]}
        onPress={() =>
          onChange(
            "matches"
          )
        }
        activeOpacity={
          activeTab ===
          "matches"
            ? 1
            : 0.85
        }
      >
        <Text
          style={[
            styles.segmentText,
            activeTab ===
              "matches" &&
              styles.segmentTextActive,
          ]}
        >
          Partidas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.segmentButton,
          activeTab ===
            "stats" &&
            styles.segmentButtonActive,
        ]}
        onPress={() =>
          onChange(
            "stats"
          )
        }
        activeOpacity={
          activeTab ===
          "stats"
            ? 1
            : 0.85
        }
      >
        <Text
          style={[
            styles.segmentText,
            activeTab ===
              "stats" &&
              styles.segmentTextActive,
          ]}
        >
          Estatísticas
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function MatchCard({
  item,
  onPress,
}: {
  item: SharedMatchDetail;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={
        styles.matchCard
      }
      activeOpacity={
        0.85
      }
      onPress={
        onPress
      }
    >
      <View
        style={
          styles.dateBadge
        }
      >
        <Text
          style={
            styles.dateDay
          }
        >
          {new Date(
            item.matchDate
          ).getDate()}
        </Text>

        <Text
          style={
            styles.dateMonth
          }
        >
          {new Intl.DateTimeFormat(
            "pt-PT",
            {
              month:
                "short",
            }
          )
            .format(
              new Date(
                item.matchDate
              )
            )
            .replace(
              ".",
              ""
            )
            .toUpperCase()}
        </Text>
      </View>

      <View
        style={
          styles.matchInfo
        }
      >
        <View
          style={
            styles.matchTitleRow
          }
        >
          <Text
            style={
              styles.matchTitle
            }
          >
            {resultText(
              item.result
            )}
          </Text>

          {item.durationInMinutes ? (
            <View
              style={
                styles.durationPill
              }
            >
              <Ionicons
                name="time-outline"
                size={11}
                color={
                  COLORS.textMuted
                }
              />

              <Text
                style={
                  styles.durationPillText
                }
              >
                {duration(
                  item.durationInMinutes
                )}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[
            styles.scoreText,
            !hasScore(
              item
            ) &&
              styles.scoreTextMuted,
          ]}
        >
          {formatScore(
            item
          )}
        </Text>

        <View
          style={
            styles.metaRow
          }
        >
          <Ionicons
            name="calendar-outline"
            size={12}
            color={
              COLORS.textMuted
            }
          />

          <Text
            style={
              styles.metaText
            }
          >
            {formatLongDate(
              item.matchDate
            )}
          </Text>

          {!!item.location && (
            <>
              <Text
                style={
                  styles.metaDot
                }
              >
                ·
              </Text>

              <Ionicons
                name="location-outline"
                size={12}
                color={
                  COLORS.textMuted
                }
              />

              <Text
                style={
                  styles.metaText
                }
                numberOfLines={
                  1
                }
              >
                {
                  item.location
                }
              </Text>
            </>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={
          COLORS.textMuted
        }
      />
    </TouchableOpacity>
  );
}

function StatsContent({
  stats,
}: {
  stats: GameStats;
}) {
  if (
    stats.totalMatches ===
    0
  ) {
    return (
      <View
        style={
          styles.statsEmptyCard
        }
      >
        <View
          style={
            styles.emptyIconWrap
          }
        >
          <Ionicons
            name="stats-chart-outline"
            size={34}
            color={
              COLORS.primary
            }
          />
        </View>

        <Text
          style={
            styles.emptyTitle
          }
        >
          Ainda não há
          estatísticas
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Quando jogarem
          este jogo juntos,
          as estatísticas
          aparecem aqui.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.statsContent
      }
    >
      {stats.competitiveMatches >
        0 && (
        <StatsSection
          title="Confrontos"
        >
          <View
            style={
              styles.scoreBoard
            }
          >
            <View
              style={
                styles.scoreSide
              }
            >
              <Text
                style={[
                  styles.scoreValue,
                  styles.scoreValuePrimary,
                ]}
              >
                {
                  stats.currentUserWins
                }
              </Text>

              <Text
                style={
                  styles.scoreLabel
                }
              >
                Tu
              </Text>
            </View>

            <View
              style={
                styles.scoreCenter
              }
            >
              <Text
                style={
                  styles.scoreDash
                }
              >
                –
              </Text>

              {stats.draws >
                0 && (
                <Text
                  style={
                    styles.drawText
                  }
                >
                  {
                    stats.draws
                  }{" "}
                  empate
                  {stats.draws ===
                  1
                    ? ""
                    : "s"}
                </Text>
              )}
            </View>

            <View
              style={
                styles.scoreSide
              }
            >
              <Text
                style={
                  styles.scoreValue
                }
              >
                {
                  stats.friendWins
                }
              </Text>

              <Text
                style={
                  styles.scoreLabel
                }
              >
                Amigo
              </Text>
            </View>
          </View>

          {stats.competitiveWinRate !=
            null && (
            <MetricRow
              label="A tua taxa de vitória"
              value={`${stats.competitiveWinRate}%`}
            />
          )}
        </StatsSection>
      )}

      {stats.cooperativeMatches >
        0 && (
        <StatsSection
          title="Cooperativo"
        >
          <MetricRow
            label="Vitórias em equipa"
            value={
              stats.teamWins
            }
          />

          <MetricRow
            label="Derrotas em equipa"
            value={
              stats.teamLosses
            }
          />

          {stats.cooperativeSuccessRate !=
            null && (
            <MetricRow
              label="Taxa de sucesso"
              value={`${stats.cooperativeSuccessRate}%`}
            />
          )}
        </StatsSection>
      )}

      <StatsSection
        title="Tempo"
      >
        <MetricRow
          label="Tempo total"
          value={duration(
            stats.totalMinutes
          )}
        />

        <MetricRow
          label="Duração média"
          value={
            stats.averageDuration !=
            null
              ? duration(
                  stats.averageDuration
                )
              : "—"
          }
        />
      </StatsSection>

      {(stats.currentUserBestScore !=
        null ||
        stats.friendBestScore !=
          null) && (
        <StatsSection
          title="Pontuações"
        >
          <MetricRow
            label="Tua melhor pontuação"
            value={
              stats.currentUserBestScore ??
              "—"
            }
          />

          <MetricRow
            label="Melhor pontuação do amigo"
            value={
              stats.friendBestScore ??
              "—"
            }
          />
        </StatsSection>
      )}
    </View>
  );
}

function StatsSection({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <View
      style={
        styles.statsSection
      }
    >
      <Text
        style={
          styles.statsSectionTitle
        }
      >
        {title}
      </Text>

      <View
        style={
          styles.statsSectionCard
        }
      >
        {children}
      </View>
    </View>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number;
}) {
  return (
    <View
      style={
        styles.metricRow
      }
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function MatchesEmptyState() {
  return (
    <View
      style={
        styles.empty
      }
    >
      <View
        style={
          styles.emptyIconWrap
        }
      >
        <Ionicons
          name="dice-outline"
          size={34}
          color={
            COLORS.primary
          }
        />
      </View>

      <Text
        style={
          styles.emptyTitle
        }
      >
        Ainda não há
        partidas deste jogo
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        Quando vocês
        jogarem este jogo
        juntos, o histórico
        aparece aqui.
      </Text>
    </View>
  );
}

function QuickMeta({
  icon,
  label,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View
      style={
        styles.quickMeta
      }
    >
      <Ionicons
        name={icon}
        size={13}
        color={
          COLORS.textMuted
        }
      />

      <Text
        style={
          styles.quickMetaText
        }
      >
        {label}
      </Text>
    </View>
  );
}

function SummaryMetric({
  value,
  label,
}: {
  value:
    | string
    | number;
  label: string;
}) {
  return (
    <View
      style={
        styles.summaryMetric
      }
    >
      <Text
        style={
          styles.summaryMetricValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.summaryMetricLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

type GameStats = {
  totalMatches: number;
  currentUserWins: number;
  friendWins: number;
  draws: number;
  teamWins: number;
  teamLosses: number;
  competitiveMatches: number;
  cooperativeMatches: number;
  totalMinutes: number;
  averageDuration:
    | number
    | null;
  currentUserBestScore:
    | number
    | null;
  friendBestScore:
    | number
    | null;
  competitiveWinRate:
    | number
    | null;
  cooperativeSuccessRate:
    | number
    | null;
};

function calculateStats(
  list: SharedMatchDetail[]
): GameStats {
  const currentUserWins =
    list.filter(
      (match) =>
        match.result ===
        "currentUserWin"
    ).length;

  const friendWins =
    list.filter(
      (match) =>
        match.result ===
        "otherUserWin"
    ).length;

  const draws =
    list.filter(
      (match) =>
        match.result ===
        "draw"
    ).length;

  const teamWins =
    list.filter(
      (match) =>
        match.result ===
        "teamWin"
    ).length;

  const teamLosses =
    list.filter(
      (match) =>
        match.result ===
        "teamLoss"
    ).length;

  const competitiveMatches =
    currentUserWins +
    friendWins +
    draws;

  const cooperativeMatches =
    teamWins +
    teamLosses;

  const totalMinutes =
    list.reduce(
      (
        sum,
        match
      ) =>
        sum +
        (match.durationInMinutes ??
          0),
      0
    );

  const matchesWithDuration =
    list.filter(
      (match) =>
        match.durationInMinutes !=
        null
    );

  const averageDuration =
    matchesWithDuration.length >
    0
      ? Math.round(
          matchesWithDuration.reduce(
            (
              sum,
              match
            ) =>
              sum +
              (match.durationInMinutes ??
                0),
            0
          ) /
            matchesWithDuration.length
        )
      : null;

  const currentUserScores =
    list
      .map(
        (match) =>
          match.currentUserScore
      )
      .filter(
        (
          score
        ): score is number =>
          score != null
      );

  const friendScores =
    list
      .map(
        (match) =>
          match.otherUserScore
      )
      .filter(
        (
          score
        ): score is number =>
          score != null
      );

  const currentUserBestScore =
    currentUserScores.length >
    0
      ? Math.max(
          ...currentUserScores
        )
      : null;

  const friendBestScore =
    friendScores.length >
    0
      ? Math.max(
          ...friendScores
        )
      : null;

  const competitiveWinRate =
    competitiveMatches >
    0
      ? Math.round(
          (currentUserWins /
            competitiveMatches) *
            100
        )
      : null;

  const cooperativeSuccessRate =
    cooperativeMatches >
    0
      ? Math.round(
          (teamWins /
            cooperativeMatches) *
            100
        )
      : null;

  return {
    totalMatches:
      list.length,
    currentUserWins,
    friendWins,
    draws,
    teamWins,
    teamLosses,
    competitiveMatches,
    cooperativeMatches,
    totalMinutes,
    averageDuration,
    currentUserBestScore,
    friendBestScore,
    competitiveWinRate,
    cooperativeSuccessRate,
  };
}

function duration(
  minutes: number
) {
  if (!minutes) {
    return "0m";
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;

  return hours
    ? `${hours}h${
        remaining
          ? ` ${remaining}m`
          : ""
      }`
    : `${remaining}m`;
}

function formatShortDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-PT",
    {
      day: "numeric",
      month: "short",
    }
  ).format(
    new Date(value)
  );
}

function formatLongDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-PT",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}

function resultText(
  result: SharedMatchDetail["result"]
) {
  switch (result) {
    case "teamWin":
      return "Vitória em equipa";

    case "teamLoss":
      return "Derrota em equipa";

    case "currentUserWin":
      return "Tu venceste";

    case "otherUserWin":
      return "O teu amigo venceu";

    default:
      return "Empate";
  }
}

function hasScore(
  item: SharedMatchDetail
) {
  return (
    item.currentUserScore !=
      null ||
    item.otherUserScore !=
      null
  );
}

function formatScore(
  item: SharedMatchDetail
) {
  if (!hasScore(item)) {
    return "Sem pontuação registada";
  }

  return `${
    item.currentUserScore ??
    "–"
  } — ${
    item.otherUserScore ??
    "–"
  }`;
}

const cardShadow = {
  shadowColor:
    "#0B1220",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity:
    0.055,
  shadowRadius: 10,
  elevation: 2,
};

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.background,
      gap: 10,
      padding: 24,
    },

    loadingText: {
      color:
        COLORS.textMuted,
      fontSize: 13,
    },

    errorTitle: {
      marginTop: 5,
      fontSize: 18,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    errorText: {
      color:
        COLORS.error,
      textAlign:
        "center",
    },

    retryButton: {
      marginTop: 8,
      backgroundColor:
        COLORS.primary,
      paddingHorizontal:
        18,
      paddingVertical:
        10,
      borderRadius: 10,
    },

    retryText: {
      color:
        "#FFFFFF",
      fontWeight:
        "700",
    },

    content: {
      paddingHorizontal:
        16,
      paddingTop: 8,
      paddingBottom: 40,
    },

    gameHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingVertical: 8,
    },

    gameCover: {
      width: 82,
      height: 82,
      borderRadius: 16,
      backgroundColor:
        COLORS.surface,
    },

    gameCoverPlaceholder: {
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        `${COLORS.primary}0D`,
    },

    gameHeaderInfo: {
      flex: 1,
      marginLeft: 14,
    },

    title: {
      fontSize: 23,
      lineHeight: 27,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    subtitle: {
      marginTop: 3,
      fontSize: 13,
      color:
        COLORS.textMuted,
    },

    quickMetaRow: {
      flexDirection:
        "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 9,
    },

    quickMeta: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    quickMetaText: {
      fontSize: 11,
      color:
        COLORS.textMuted,
      fontWeight:
        "600",
    },

    segmented: {
      flexDirection:
        "row",
      backgroundColor:
        COLORS.surface,
      borderRadius: 12,
      padding: 4,
      marginTop: 12,
    },

    segmentButton: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      minHeight: 38,
      borderRadius: 9,
    },

    segmentButtonActive: {
      backgroundColor:
        COLORS.card,
      ...cardShadow,
    },

    segmentText: {
      fontSize: 13,
      fontWeight:
        "700",
      color:
        COLORS.textMuted,
    },

    segmentTextActive: {
      color:
        COLORS.primary,
    },

    summaryStrip: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 14,
      paddingVertical: 13,
      backgroundColor:
        COLORS.card,
      borderRadius: 16,
      ...cardShadow,
    },

    summaryMetric: {
      flex: 1,
      alignItems:
        "center",
    },

    summaryMetricValue: {
      fontSize: 16,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    summaryMetricLabel: {
      marginTop: 3,
      fontSize: 10,
      color:
        COLORS.textMuted,
    },

    sectionHeader: {
      marginTop: 22,
      marginBottom: 2,
      flexDirection:
        "row",
      alignItems:
        "baseline",
      justifyContent:
        "space-between",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    sectionCount: {
      fontSize: 12,
      color:
        COLORS.textMuted,
    },

    matchCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        COLORS.card,
      borderRadius: 17,
      padding: 13,
      marginTop: 10,
      ...cardShadow,
    },

    dateBadge: {
      width: 50,
      minHeight: 54,
      borderRadius: 13,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        `${COLORS.primary}0D`,
    },

    dateDay: {
      fontSize: 18,
      lineHeight: 20,
      fontWeight:
        "800",
      color:
        COLORS.primary,
    },

    dateMonth: {
      marginTop: 3,
      fontSize: 10,
      fontWeight:
        "800",
      color:
        COLORS.primary,
    },

    matchInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },

    matchTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    matchTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    durationPill: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 3,
      paddingHorizontal:
        7,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        COLORS.surface,
    },

    durationPillText: {
      fontSize: 10,
      color:
        COLORS.textMuted,
      fontWeight:
        "600",
    },

    scoreText: {
      marginTop: 4,
      fontSize: 13,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    scoreTextMuted: {
      fontSize: 11,
      fontWeight:
        "600",
      color:
        COLORS.textMuted,
    },

    metaRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 7,
    },

    metaText: {
      maxWidth: 150,
      fontSize: 10,
      color:
        COLORS.textMuted,
    },

    metaDot: {
      fontSize: 10,
      color:
        COLORS.textMuted,
      marginHorizontal: 1,
    },

    statsContent: {
      paddingTop: 4,
    },

    statsSection: {
      marginTop: 20,
    },

    statsSectionTitle: {
      fontSize: 17,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
      marginBottom: 9,
    },

    statsSectionCard: {
      backgroundColor:
        COLORS.card,
      borderRadius: 18,
      padding: 16,
      ...cardShadow,
    },

    scoreBoard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 8,
      marginBottom: 10,
    },

    scoreSide: {
      flex: 1,
      alignItems:
        "center",
    },

    scoreCenter: {
      width: 70,
      alignItems:
        "center",
    },

    scoreValue: {
      fontSize: 34,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    scoreValuePrimary: {
      color:
        COLORS.primary,
    },

    scoreLabel: {
      marginTop: 3,
      fontSize: 12,
      fontWeight:
        "700",
      color:
        COLORS.textMuted,
    },

    scoreDash: {
      fontSize: 22,
      fontWeight:
        "800",
      color:
        COLORS.textMuted,
    },

    drawText: {
      marginTop: 5,
      fontSize: 10,
      color:
        COLORS.textMuted,
      textAlign:
        "center",
    },

    metricRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingVertical: 11,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
    },

    metricLabel: {
      flex: 1,
      color:
        COLORS.textMuted,
      fontSize: 13,
    },

    metricValue: {
      marginLeft: 14,
      color:
        COLORS.onBackground,
      fontSize: 14,
      fontWeight:
        "800",
    },

    empty: {
      alignItems:
        "center",
      paddingVertical: 70,
      paddingHorizontal:
        30,
    },

    statsEmptyCard: {
      marginTop: 20,
      alignItems:
        "center",
      paddingVertical: 38,
      paddingHorizontal:
        30,
      backgroundColor:
        COLORS.card,
      borderRadius: 18,
      ...cardShadow,
    },

    emptyIconWrap: {
      width: 68,
      height: 68,
      borderRadius: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        `${COLORS.primary}0D`,
      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 17,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
      textAlign:
        "center",
    },

    emptyText: {
      marginTop: 7,
      textAlign:
        "center",
      color:
        COLORS.textMuted,
      lineHeight: 19,
      fontSize: 13,
    },
  });
