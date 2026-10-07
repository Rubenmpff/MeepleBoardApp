import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
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
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { ROUTES } from "@/src/constants/routes";

import {
  getSharedMatchesForGame,
  SharedMatchDetail,
} from "../services/friendshipService";

type ActiveTab =
  | "matches"
  | "stats";

export default function SharedGameHistoryScreen() {
  const { t } = useTranslation("friends");
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
            t("text.unableToLoadSharedHistory")
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
    t("text.sharedHistory");

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

  if (loading) { return <ScreenLayout title={t("text.gameHistory")}><ScreenState loading message={t("text.loadingHistory")} /></ScreenLayout>; }

  if (error) { return <ScreenLayout title={t("text.gameHistory")}><ScreenState error message={error} onRetry={() => load()} retryLabel={t("text.retry")} /></ScreenLayout>; }

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
            <ScreenHeader appearance="refresh"
              mode="back" leftAccessibilityLabel={t("card.back")}
              title={t("text.gameHistory")}
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
                label={t("text.matchCountLabel")}
              />

              <SummaryMetric
                value={duration(
                  stats.totalMinutes
                )}
                label={t("text.totalTime")}
              />

              <SummaryMetric
                value={
                  lastPlayed
                }
                label={t("text.lastPlayed")}
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
                    {t("text.matches")}</Text>

                  <Text
                    style={
                      styles.sectionCount
                    }
                  >
                    {t("counts.records", { count: list.length })}
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
  const { t } = useTranslation("friends");
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
          {gameName}</Text>

        <Text
          style={
            styles.subtitle
          }
        >
          {t("text.sharedHistory")}</Text>

        <View
          style={
            styles.quickMetaRow
          }
        >
          <QuickMeta
            icon="dice-outline"
            label={`${matchesCount} ${matchesCount ===
                1
                ? t("text.match")
                : t("text.matchCountLabel")
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
  const { t } = useTranslation("friends");
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
        accessibilityRole="tab" accessibilityState={{ selected: activeTab === "matches" }} onPress={() =>
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
          {t("text.matches")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.segmentButton,
          activeTab ===
          "stats" &&
          styles.segmentButtonActive,
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "stats" }}
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
          {t("text.statistics")}</Text>
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
            (i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB"),
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
  const { t } = useTranslation("friends");
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
          {t("text.noStatisticsYet")}</Text>

        <Text
          style={
            styles.emptyText
          }
        >
          {t("text.statisticsWillAppearHereAfterYouPlayThisGameTogether")}</Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.statsContent
      }
    >
      <Text style={styles.emptyText}>{i18n.t("matches:outcomes.withoutResult", { count: stats.withoutResult })} · {i18n.t("matches:outcomes.legacyCount", { count: stats.legacyResults })}</Text>
      <Text style={styles.emptyText}>{i18n.t("matches:outcomes.loadedSample", { count: stats.totalMatches })}</Text>
      {stats.competitiveMatches >
        0 && (
          <StatsSection
            title={t("text.headToHead")}
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
                  {t("text.you")}</Text>
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
                      {t("counts.draws", { count: stats.draws })}
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
                  {t("text.friend")}</Text>
              </View>
            </View>

            {stats.competitiveWinRate !=
              null && (
                <MetricRow
                  label={t("text.yourWinRate")}
                  value={`${stats.competitiveWinRate}% · n=${stats.competitiveMatches}`}
                />
              )}
          </StatsSection>
        )}

      {stats.cooperativeMatches >
        0 && (
          <StatsSection
            title={t("text.cooperative")}
          >
            <MetricRow
              label={t("text.teamWins")}
              value={
                stats.teamWins
              }
            />

            <MetricRow
              label={t("text.teamLosses")}
              value={
                stats.teamLosses
              }
            />

            <MetricRow label={i18n.t("matches:outcomes.Draw")} value={stats.teamDraws} />
            {stats.cooperativeSuccessRate !=
              null && (
                <MetricRow
                  label={t("text.successRate")}
                  value={`${stats.cooperativeSuccessRate}% · n=${stats.cooperativeMatches}`}
                />
              )}
          </StatsSection>
        )}

      <StatsSection
        title={t("text.timeTitle")}
      >
        <MetricRow
          label={t("text.totalTimeTitle")}
          value={duration(
            stats.totalMinutes
          )}
        />

        <MetricRow
          label={t("text.averageDuration")}
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
            title={t("text.scores")}
          >
            <MetricRow
              label={t("text.yourBestScore")}
              value={
                stats.currentUserBestScore ??
                "—"
              }
            />

            <MetricRow
              label={t("text.friendsBestScore")}
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
        {title}</Text>

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
        {label}</Text>

      <Text
        style={
          styles.metricValue
        }
      >
        {value}</Text>
    </View>
  );
}

function MatchesEmptyState() {
  const { t } = useTranslation("friends");
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
        {t("text.noSharedMatchesForThisGameYet")}</Text>

      <Text
        style={
          styles.emptyText
        }
      >
        {t("text.historyWillAppearHereAfterYouPlayThisGameTogether")}</Text>
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
        {label}</Text>
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
        {value}</Text>

      <Text
        style={
          styles.summaryMetricLabel
        }
      >
        {label}</Text>
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
  teamDraws: number;
  withoutResult: number;
  legacyResults: number;
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
  const competitive = list.filter(m => m.gameMode === "COMPETITIVE" && m.resultSource === "Explicit" && m.currentOutcome != null && m.currentOutcome !== "Undefined");
  const cooperative = list.filter(m => m.gameMode === "COOPERATIVE" && m.resultSource === "Explicit" && m.currentOutcome != null && m.currentOutcome !== "Undefined");
  const currentUserWins = competitive.filter(m => m.currentOutcome === "Win").length;
  const friendWins = competitive.filter(m => m.otherOutcome === "Win").length;
  const draws = competitive.filter(m => m.currentOutcome === "Draw").length;
  const teamWins = cooperative.filter(m => m.currentOutcome === "Win").length;
  const teamLosses = cooperative.filter(m => m.currentOutcome === "Loss").length;
  const teamDraws = cooperative.filter(m => m.currentOutcome === "Draw").length;
  const competitiveMatches = competitive.length, cooperativeMatches = cooperative.length;
  const withoutResult = list.filter(m => m.currentOutcome == null || m.currentOutcome === "Undefined").length;
  const legacyResults = list.filter(m => m.resultSource !== "Explicit").length;
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
    teamLosses, teamDraws, withoutResult, legacyResults,
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
    ? `${hours}h${remaining
      ? ` ${remaining}m`
      : ""
    }`
    : `${remaining}m`;
}

function formatShortDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    (i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB"),
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
    (i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB"),
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
      return i18n.t("friends:text.teamWin");

    case "teamLoss":
      return i18n.t("friends:text.teamLoss");

    case "currentUserWin":
      return i18n.t("friends:text.youWon");

    case "otherUserWin":
      return i18n.t("friends:text.yourFriendWon");

    case "draw": return i18n.t("friends:text.draw");
    case "teamDraw": case "sharedWin": case "currentUserDraw": case "otherUserDraw": case "bothLost": return i18n.t(`matches:outcomes.${result}`);
    case "undefined": return i18n.t("matches:outcomes.Undefined");
    default: return i18n.t("matches:outcomes.legacyUnknown");
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
    return i18n.t("friends:text.noScoreRecorded");
  }

  return `${item.currentUserScore ??
    "–"
    } — ${item.otherUserScore ??
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
      ...UI_STYLES.caption,
      color:
        COLORS.textMuted,
      fontSize: 13,
    },

    errorTitle: {
      ...UI_STYLES.section,
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
      ...UI_STYLES.control,
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
      ...UI_STYLES.caption,
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
      ...UI_STYLES.caption,
      fontSize: 13,
      color:
        COLORS.textMuted,
      fontWeight:
        "600",
    },

    segmented: {
flexWrap: "wrap",
      flexDirection:
        "row",
      backgroundColor:
        COLORS.surface,
      borderRadius: 12,
      padding: 4,
      marginTop: 12,
    },

    segmentButton: {
      ...UI_STYLES.control,
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      minHeight: 44,
      borderRadius: 9,
    },

    segmentButtonActive: {
      backgroundColor:
        COLORS.card,
      ...cardShadow,
    },

    segmentText: {
      ...UI_STYLES.caption,
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
      ...UI_STYLES.card,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 14,
      paddingVertical: 13,
      backgroundColor:
        COLORS.card,
      borderRadius: 20,
      ...cardShadow,
    },

    summaryMetric: {
      flex: 1,
      alignItems:
        "center",
    },

    summaryMetricValue: {
      ...UI_STYLES.body,
      fontSize: 16,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    summaryMetricLabel: {
      ...UI_STYLES.caption,
      marginTop: 3,
      fontSize: 13,
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
      ...UI_STYLES.section,
      fontSize: 18,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    sectionCount: {
      ...UI_STYLES.caption,
      fontSize: 13,
      color:
        COLORS.textMuted,
    },

    matchCard: {
      ...UI_STYLES.card,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        COLORS.card,
      borderRadius: 20,
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
      ...UI_STYLES.caption,
      marginTop: 3,
      fontSize: 13,
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
      ...UI_STYLES.caption,
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
      ...UI_STYLES.caption,
      fontSize: 13,
      color:
        COLORS.textMuted,
      fontWeight:
        "600",
    },

    scoreText: {
      ...UI_STYLES.caption,
      marginTop: 4,
      fontSize: 13,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
    },

    scoreTextMuted: {
      ...UI_STYLES.caption,
      fontSize: 13,
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
      ...UI_STYLES.caption,
      maxWidth: 150,
      fontSize: 13,
      color:
        COLORS.textMuted,
    },

    metaDot: {
      ...UI_STYLES.caption,
      fontSize: 13,
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
      ...UI_STYLES.body,
      fontSize: 17,
      fontWeight:
        "800",
      color:
        COLORS.onBackground,
      marginBottom: 9,
    },

    statsSectionCard: {
      ...UI_STYLES.card,
      backgroundColor:
        COLORS.card,
      borderRadius: 20,
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
      ...UI_STYLES.section,
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
      ...UI_STYLES.caption,
      marginTop: 3,
      fontSize: 13,
      fontWeight:
        "700",
      color:
        COLORS.textMuted,
    },

    scoreDash: {
      ...UI_STYLES.section,
      fontSize: 22,
      fontWeight:
        "800",
      color:
        COLORS.textMuted,
    },

    drawText: {
      ...UI_STYLES.caption,
      marginTop: 5,
      fontSize: 13,
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
      ...UI_STYLES.caption,
      flex: 1,
      color:
        COLORS.textMuted,
      fontSize: 13,
    },

    metricValue: {
      ...UI_STYLES.caption,
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
      ...UI_STYLES.card,
      marginTop: 20,
      alignItems:
        "center",
      paddingVertical: 38,
      paddingHorizontal:
        30,
      backgroundColor:
        COLORS.card,
      borderRadius: 20,
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
      ...UI_STYLES.body,
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
