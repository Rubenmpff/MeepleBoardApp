/**
 * FriendProfileScreen.tsx
 *
 * Perfil de um utilizador/amigo organizado em 3 tabs:
 *   Resumo   → contexto social da relação e histórico recente
 *   Partidas → todas as partidas onde ambos participámos
 *   Coleção  → coleção do amigo, respeitando a privacidade
 *
 * Estatísticas detalhadas não vivem diretamente no resumo.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { invalidateFriendsCache } from "../hooks/useFriends";
import {
  getSharedMatches,
  getUserProfile,
  removeFriend,
  sendFriendRequest,
  SharedGame,
  SharedMatchDetail,
  UserProfile,
} from "../services/friendshipService";
import { FriendActionsMenu } from "../components/FriendActionsMenu";
import { avatarColors } from "../utils/avatarPalette";
import OnlineDot from "../components/OnlineDot";
import libraryService from "@/src/features/library/services/libraryService";
import {
  GameLibraryStatus,
  getStatusTranslationKey,
} from "@/src/features/library/types/GameLibraryStatus";
import { UserGameLibrary } from "@/src/features/library/types/UserGameLibrary";

type Tab = "summary" | "matches" | "collection";
type CollectionFilter =
  | "all"
  | "owned"
  | "wishlist"
  | "common";

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("summary");

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);

    try {
      setProfile(await getUserProfile(id));
    } catch {
      Alert.alert(
        "Perfil indisponível",
        "Não foi possível carregar este perfil."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFriend() {
    if (!profile) {
      return;
    }

    setBusy(true);

    try {
      await sendFriendRequest(profile.id);

      setProfile({
        ...profile,
        relationshipStatus: "outgoingPending",
      });
    } catch {
      Alert.alert(
        "Pedido não enviado",
        "O pedido pode já existir."
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove() {
    if (!profile) {
      return;
    }

    Alert.alert(
      "Remover amigo?",
      `Remover ${profile.userName} dos amigos? As partidas e sessões continuam guardadas.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setBusy(true);

            try {
              await removeFriend(profile.id);
              invalidateFriendsCache();
              router.back();
            } catch {
              Alert.alert(
                "Não foi possível remover",
                "Tenta novamente."
              );
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  function openStats() {
    Alert.alert(
      "Estatísticas",
      "A área geral de estatísticas entre amigos ainda está a ser preparada."
    );
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>
          Perfil não encontrado.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={load}
        >
          <Text style={styles.primaryText}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isFriend =
    profile.relationshipStatus === "friends";

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["left", "right", "bottom", "top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          mode="back"
          title="Perfil"
        />

        <ProfileHeader
          profile={profile}
          isFriend={isFriend}
          busy={busy}
          onAdd={addFriend}
          onRemove={confirmRemove}
          onRequests={() =>
            router.push(
              ROUTES.FRIEND_REQUESTS as never
            )
          }
        />

        {isFriend ? (
          <View style={styles.tabsBar}>
            <TabButton
              label="Resumo"
              active={tab === "summary"}
              onPress={() => setTab("summary")}
            />
            <TabButton
              label="Partidas"
              active={tab === "matches"}
              onPress={() => setTab("matches")}
            />
            <TabButton
              label="Coleção"
              active={tab === "collection"}
              onPress={() => setTab("collection")}
            />
          </View>
        ) : null}

        {isFriend && tab === "summary" && (
          <SummaryTab
            profile={profile}
            onOpenStats={openStats}
            onSeeAllMatches={() => setTab("matches")}
            onOpenGameHistory={(gameId) =>
              router.push({
                pathname:
                  ROUTES.FRIEND_GAME_HISTORY,
                params: {
                  id: profile.id,
                  gameId,
                },
              } as never)
            }
            onOpenMatch={(matchId) =>
              router.push({
                pathname:
                  ROUTES.MATCH_DETAILS,
                params: {
                  id: matchId,
                },
              } as never)
            }
            onOpenSession={(sessionId) =>
              router.push({
                pathname:
                  ROUTES.SESSION_DETAIL,
                params: {
                  id: sessionId,
                },
              } as never)
            }
            onSeeAllCollection={() =>
              setTab("collection")
            }
            onOpenGame={(gameId) =>
              router.push({
                pathname:
                  ROUTES.GAME_DETAILS,
                params: {
                  id: gameId,
                },
              } as never)
            }
          />
        )}

        {isFriend && tab === "matches" && (
          <MatchesTab
            friendId={profile.id}
            friendName={profile.userName}
            onOpenMatch={(matchId) =>
              router.push({
                pathname:
                  ROUTES.MATCH_DETAILS,
                params: {
                  id: matchId,
                },
              } as never)
            }
          />
        )}

        {isFriend && tab === "collection" && (
          <CollectionTab
            friendId={profile.id}
            friendName={profile.userName}
            canView={profile.canViewLibrary}
            onOpenGame={(gameId) =>
              router.push({
                pathname:
                  ROUTES.GAME_DETAILS,
                params: {
                  id: gameId,
                },
              } as never)
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   HEADER
   ============================================================ */

function ProfileHeader({
  profile,
  isFriend,
  busy,
  onAdd,
  onRemove,
  onRequests,
}: {
  profile: UserProfile;
  isFriend: boolean;
  busy: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onRequests: () => void;
}) {
  const palette = avatarColors(profile.userName);

  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileTopRow}>
        <View style={styles.identityRow}>
          <View style={styles.largeAvatarWrap}>
            {profile.profilePictureUrl ? (
              <Image
                source={{
                  uri: profile.profilePictureUrl,
                }}
                style={styles.largeAvatar}
              />
            ) : (
              <View
                style={[
                  styles.largeAvatar,
                  {
                    backgroundColor:
                      palette.bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.largeAvatarText,
                    {
                      color: palette.fg,
                    },
                  ]}
                >
                  {profile.userName
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            )}

            {profile.isOnline && (
              <OnlineDot size={14} />
            )}
          </View>

          <View style={styles.identityText}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {profile.userName}
            </Text>

            <Text
              style={styles.username}
              numberOfLines={1}
            >
              @{profile.userName}
            </Text>

            {isFriend &&
              profile.friendsSince && (
                <Text
                  style={
                    styles.friendsSince
                  }
                >
                  Amigos desde{" "}
                  {formatMonth(
                    profile.friendsSince
                  )}
                </Text>
              )}
          </View>
        </View>

        {isFriend && (
          <FriendActionsMenu
            onRemove={onRemove}
          />
        )}
      </View>

      {!isFriend && (
        <NonFriendAction
          profile={profile}
          busy={busy}
          onAdd={onAdd}
          onRequests={onRequests}
        />
      )}

      <View style={styles.profileStatsRow}>
        <ProfileStat
          value={profile.totalMatches}
          label="partidas"
        />
        <ProfileStat
          value={profile.totalGamesPlayed}
          label="jogos"
        />
        <ProfileStat
          value={
            profile.canViewLibrary
              ? profile.totalGamesOwned
              : "—"
          }
          label="coleção"
        />
      </View>
    </View>
  );
}

function ProfileStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.profileStat}>
      <Text style={styles.profileStatValue}>
        {value}
      </Text>
      <Text style={styles.profileStatLabel}>
        {label}
      </Text>
    </View>
  );
}

function NonFriendAction({
  profile,
  busy,
  onAdd,
  onRequests,
}: {
  profile: UserProfile;
  busy: boolean;
  onAdd: () => void;
  onRequests: () => void;
}) {
  if (busy) {
    return (
      <ActivityIndicator
        style={styles.action}
        color={COLORS.primary}
      />
    );
  }

  if (
    profile.relationshipStatus ===
    "outgoingPending"
  ) {
    return (
      <View style={styles.disabledButton}>
        <Text style={styles.disabledText}>
          Pedido enviado
        </Text>
      </View>
    );
  }

  if (
    profile.relationshipStatus ===
    "incomingPending"
  ) {
    return (
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onRequests}
      >
        <Text style={styles.primaryText}>
          Responder ao pedido
        </Text>
      </TouchableOpacity>
    );
  }

  if (
    profile.relationshipStatus === "blocked"
  ) {
    return (
      <View style={styles.disabledButton}>
        <Text style={styles.disabledText}>
          Indisponível
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.primaryButton}
      onPress={onAdd}
    >
      <Text style={styles.primaryText}>
        Adicionar amigo
      </Text>
    </TouchableOpacity>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        active && styles.tabButtonActive,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.tabButtonText,
          active &&
            styles.tabButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ============================================================
   TAB: RESUMO
   ============================================================ */

function SummaryTab({
  profile,
  onOpenStats,
  onSeeAllMatches,
  onOpenGameHistory,
  onOpenMatch,
  onOpenSession,
  onSeeAllCollection,
  onOpenGame,
}: {
  profile: UserProfile;
  onOpenStats: () => void;
  onSeeAllMatches: () => void;
  onOpenGameHistory: (
    gameId: string
  ) => void;
  onOpenMatch: (
    matchId: string
  ) => void;
  onOpenSession: (
    sessionId: string
  ) => void;
  onSeeAllCollection: () => void;
  onOpenGame: (
    gameId: string
  ) => void;
}) {
  return (
    <View>
      <View style={styles.relationshipCard}>
        <View style={styles.relationshipHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              VOCÊS
            </Text>
            <Text
              style={
                styles.relationshipTitle
              }
            >
              O vosso histórico
            </Text>
          </View>

          <TouchableOpacity
            style={styles.statsLink}
            onPress={onOpenStats}
          >
            <Ionicons
              name="stats-chart-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text
              style={
                styles.statsLinkText
              }
            >
              Estatísticas
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.relationshipStats}>
          <CompactStat
            value={profile.sharedMatches}
            label="partidas"
          />
          <CompactStat
            value={profile.sharedGames}
            label="jogos"
          />
          <CompactStat
            value={duration(
              profile.sharedMinutes
            )}
            label="tempo"
          />
          <CompactStat
            value={profile.sharedSessions}
            label="sessões"
          />
        </View>
      </View>

      {profile.sharedMatches === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons
            name="dice-outline"
            size={34}
            color={COLORS.primary}
          />

          <Text style={styles.emptyTitle}>
            Ainda não registaram partidas
            juntos.
          </Text>

          <Text style={styles.muted}>
            Quando jogarem, o vosso
            histórico aparecerá aqui.
          </Text>
        </View>
      )}

      {profile.topSharedGames.length >
        0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Jogos mais jogados juntos
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.sharedGamesRow
            }
          >
            {profile.topSharedGames.map(
              (game) => (
                <SharedGameCard
                  key={game.gameId}
                  game={game}
                  onPress={() =>
                    onOpenGameHistory(
                      game.gameId
                    )
                  }
                />
              )
            )}
          </ScrollView>
        </View>
      )}

      {profile.recentSharedMatches.length >
        0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Últimas partidas
            </Text>

            <TouchableOpacity
              onPress={onSeeAllMatches}
            >
              <Text
                style={
                  styles.sectionSeeAll
                }
              >
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listCard}>
            {profile.recentSharedMatches.map(
              (match, index) => (
                <TouchableOpacity
                  key={match.matchId}
                  style={[
                    styles.compactMatchRow,
                    index ===
                      profile
                        .recentSharedMatches
                        .length -
                        1 &&
                      styles.lastRow,
                  ]}
                  onPress={() =>
                    onOpenMatch(
                      match.matchId
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={
                      styles.matchIcon
                    }
                  >
                    <Ionicons
                      name="dice-outline"
                      size={18}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.compactMatchInfo
                    }
                  >
                    <Text
                      style={
                        styles.compactMatchGame
                      }
                      numberOfLines={1}
                    >
                      {match.gameName}
                    </Text>

                    <Text
                      style={
                        styles.compactMatchMeta
                      }
                      numberOfLines={1}
                    >
                      {formatDate(
                        match.matchDate
                      )}
                      {" · "}
                      {resultText(
                        match.result,
                        profile.userName
                      )}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={
                      COLORS.textMuted
                    }
                  />
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      )}

      {profile.recentSharedSessions.length >
        0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Sessões juntos
            </Text>
          </View>

          <View style={styles.listCard}>
            {profile.recentSharedSessions.map(
              (session, index) => (
                <TouchableOpacity
                  key={session.sessionId}
                  style={[
                    styles.compactMatchRow,
                    index ===
                      profile
                        .recentSharedSessions
                        .length -
                        1 &&
                      styles.lastRow,
                  ]}
                  onPress={() =>
                    onOpenSession(
                      session.sessionId
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={
                      styles.matchIcon
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.compactMatchInfo
                    }
                  >
                    <Text
                      style={
                        styles.compactMatchGame
                      }
                      numberOfLines={1}
                    >
                      {session.name}
                    </Text>

                    <Text
                      style={
                        styles.compactMatchMeta
                      }
                    >
                      {formatDate(
                        session.date
                      )}
                      {" · "}
                      {session.matchesCount}{" "}
                      partida
                      {session.matchesCount ===
                      1
                        ? ""
                        : "s"}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={
                      COLORS.textMuted
                    }
                  />
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      )}

      {profile.canViewLibrary &&
        profile.commonOwnedGames.length >
          0 && (
          <View style={styles.section}>
            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                Jogos que ambos têm
              </Text>

              <TouchableOpacity
                onPress={
                  onSeeAllCollection
                }
              >
                <Text
                  style={
                    styles.sectionSeeAll
                  }
                >
                  Ver coleção
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.commonGamesRow
              }
            >
              {profile.commonOwnedGames.map(
                (game: SharedGame) => (
                  <TouchableOpacity
                    key={game.gameId}
                    style={
                      styles.commonGameCard
                    }
                    onPress={() =>
                      onOpenGame(
                        game.gameId
                      )
                    }
                    activeOpacity={0.85}
                  >
                    {game.imageUrl ? (
                      <Image
                        source={{
                          uri: game.imageUrl,
                        }}
                        style={
                          styles.commonGameCover
                        }
                      />
                    ) : (
                      <View
                        style={[
                          styles.commonGameCover,
                          styles.coverPlaceholder,
                        ]}
                      >
                        <Ionicons
                          name="dice-outline"
                          size={26}
                          color={
                            COLORS.textMuted
                          }
                        />
                      </View>
                    )}

                    <Text
                      style={
                        styles.commonGameName
                      }
                      numberOfLines={2}
                    >
                      {game.name}
                    </Text>

                    <View
                      style={
                        styles.commonBadge
                      }
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color={
                          COLORS.primary
                        }
                      />
                      <Text
                        style={
                          styles.commonBadgeText
                        }
                      >
                        Ambos têm
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        )}

      {!profile.canViewLibrary && (
        <View style={styles.privateCard}>
          <View
            style={styles.privateIcon}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.textMuted}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.privateTitle}
            >
              Coleção privada
            </Text>
            <Text
              style={styles.privateText}
            >
              {profile.userName} não
              partilhou a coleção.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function CompactStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.compactStat}>
      <Text style={styles.compactStatValue}>
        {value}
      </Text>
      <Text style={styles.compactStatLabel}>
        {label}
      </Text>
    </View>
  );
}

function SharedGameCard({
  game,
  onPress,
}: {
  game: SharedGame;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.sharedGameCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {game.imageUrl ? (
        <Image
          source={{
            uri: game.imageUrl,
          }}
          style={styles.sharedGameCover}
        />
      ) : (
        <View
          style={[
            styles.sharedGameCover,
            styles.coverPlaceholder,
          ]}
        >
          <Ionicons
            name="dice-outline"
            size={28}
            color={COLORS.textMuted}
          />
        </View>
      )}

      <Text
        style={styles.sharedGameName}
        numberOfLines={2}
      >
        {game.name}
      </Text>

      <Text style={styles.sharedGameMeta}>
        {game.matchesCount}{" "}
        partida
        {game.matchesCount === 1
          ? ""
          : "s"}
      </Text>
    </TouchableOpacity>
  );
}

/* ============================================================
   TAB: PARTIDAS
   ============================================================ */

function MatchesTab({
  friendId,
  friendName,
  onOpenMatch,
}: {
  friendId: string;
  friendName: string;
  onOpenMatch: (
    matchId: string
  ) => void;
}) {
  const [items, setItems] =
    useState<SharedMatchDetail[]>([]);
  const [totalCount, setTotalCount] =
    useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] =
    useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const pageSize = 20;

  const load = useCallback(
    async (
      nextPage: number,
      append: boolean
    ) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result =
          await getSharedMatches(
            friendId,
            nextPage,
            pageSize
          );

        setItems((current) =>
          append
            ? [
                ...current,
                ...result.items,
              ]
            : result.items
        );

        setTotalCount(
          result.totalCount
        );

        setPage(result.page);
      } catch {
        setError(
          "Não foi possível carregar as partidas."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [friendId]
  );

  useEffect(() => {
    void load(0, false);
  }, [load]);

  const hasMore =
    items.length < totalCount;

  if (loading) {
    return (
      <View style={styles.tabLoading}>
        <ActivityIndicator
          color={COLORS.primary}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.muted}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            load(0, false)
          }
        >
          <Text
            style={styles.primaryText}
          >
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons
          name="dice-outline"
          size={36}
          color={COLORS.primary}
        />

        <Text style={styles.emptyTitle}>
          Ainda não registaram partidas
          juntos.
        </Text>

        <Text style={styles.muted}>
          Quando jogarem, o vosso
          histórico aparecerá aqui.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabSection}>
      <View style={styles.tabHeadingRow}>
        <View>
          <Text style={styles.tabHeading}>
            Partidas juntos
          </Text>
          <Text style={styles.tabSubheading}>
            {totalCount} registo
            {totalCount === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      {items.map((match) => (
        <TouchableOpacity
          key={match.matchId}
          style={styles.matchCard}
          onPress={() =>
            onOpenMatch(match.matchId)
          }
          activeOpacity={0.85}
        >
          {match.imageUrl ? (
            <Image
              source={{
                uri: match.imageUrl,
              }}
              style={styles.gameImage}
            />
          ) : (
            <View
              style={
                styles.gameImagePlaceholder
              }
            >
              <Ionicons
                name="dice-outline"
                size={18}
                color={
                  COLORS.textMuted
                }
              />
            </View>
          )}

          <View style={styles.rowInfo}>
            <Text
              style={styles.rowTitle}
              numberOfLines={1}
            >
              {match.gameName}
            </Text>

            <Text style={styles.rowMeta}>
              {formatDate(
                match.matchDate
              )}
              {" · "}
              {resultText(
                match.result,
                friendName
              )}
            </Text>

            <Text
              style={
                styles.rowMetaSecondary
              }
            >
              {formatMatchScore(match)}
              {match.durationInMinutes
                ? ` · ${duration(
                    match.durationInMinutes
                  )}`
                : ""}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      ))}

      {hasMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={() =>
            load(page + 1, true)
          }
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator
              color={COLORS.primary}
            />
          ) : (
            <Text
              style={styles.loadMoreText}
            >
              Carregar mais
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

function formatMatchScore(
  match: SharedMatchDetail
) {
  if (
    match.currentUserScore == null &&
    match.otherUserScore == null
  ) {
    return "";
  }

  return `${match.currentUserScore ?? "–"}–${match.otherUserScore ?? "–"}`;
}

/* ============================================================
   TAB: COLEÇÃO
   ============================================================ */

function CollectionTab({
  friendId,
  friendName,
  canView,
  onOpenGame,
}: {
  friendId: string;
  friendName: string;
  canView: boolean;
  onOpenGame: (
    gameId: string
  ) => void;
}) {
  const currentUser = useSelector(
    (state: RootState) =>
      state.auth.user
  );

  const [items, setItems] = useState<
    UserGameLibrary[] | null
  >(null);

  const [myOwnedIds, setMyOwnedIds] =
    useState<Set<string>>(
      new Set()
    );

  const [loading, setLoading] =
    useState(canView);

  const [error, setError] =
    useState<string | null>(
      canView ? null : "private"
    );

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<CollectionFilter>("all");

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      setError("private");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [theirs, mine] =
          await Promise.all([
            libraryService.getUserLibrary(
              friendId
            ) as Promise<
              UserGameLibrary[]
            >,

            currentUser?.id
              ? (libraryService.getUserLibrary(
                  currentUser.id
                ) as Promise<
                  UserGameLibrary[]
                >)
              : Promise.resolve([]),
          ]);

        if (cancelled) {
          return;
        }

        setItems(
          Array.isArray(theirs)
            ? theirs
            : []
        );

        setMyOwnedIds(
          new Set(
            (Array.isArray(mine)
              ? mine
              : []
            )
              .filter(
                (game) =>
                  game.status ===
                  GameLibraryStatus.Owned
              )
              .map(
                (game) =>
                  game.gameId
              )
          )
        );
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        if (
          err?.response?.status === 403
        ) {
          setError("private");
        } else {
          setError("load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    friendId,
    canView,
    currentUser?.id,
  ]);

  const filtered = useMemo(() => {
    const list = items ?? [];
    const normalized = query
      .trim()
      .toLocaleLowerCase();

    return list
      .filter(
        (game) =>
          !normalized ||
          game.gameName
            .toLocaleLowerCase()
            .includes(normalized)
      )
      .filter((game) => {
        if (filter === "owned") {
          return (
            game.status ===
            GameLibraryStatus.Owned
          );
        }

        if (
          filter === "wishlist"
        ) {
          return (
            game.status ===
            GameLibraryStatus.Wishlist
          );
        }

        if (filter === "common") {
          return myOwnedIds.has(
            game.gameId
          );
        }

        return true;
      });
  }, [
    items,
    query,
    filter,
    myOwnedIds,
  ]);

  if (loading) {
    return (
      <View style={styles.tabLoading}>
        <ActivityIndicator
          color={COLORS.primary}
        />
      </View>
    );
  }

  if (error === "private") {
    return (
      <View style={styles.emptyCard}>
        <Ionicons
          name="lock-closed-outline"
          size={36}
          color={COLORS.textMuted}
        />

        <Text style={styles.emptyTitle}>
          A coleção de {friendName} é
          privada.
        </Text>
      </View>
    );
  }

  if (error === "load") {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.muted}>
          Não foi possível carregar a
          coleção.
        </Text>
      </View>
    );
  }

  if ((items ?? []).length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons
          name="albums-outline"
          size={36}
          color={COLORS.primary}
        />

        <Text style={styles.emptyTitle}>
          {friendName} ainda não adicionou
          jogos à coleção.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabSection}>
      <Text style={styles.collectionTitle}>
        Coleção de {friendName}
      </Text>

      <Text style={styles.collectionCount}>
        {(items ?? []).length} jogos
      </Text>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={18}
          color={COLORS.textMuted}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Pesquisar na coleção..."
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.filterRow
        }
      >
        <FilterChip
          label="Todos"
          active={filter === "all"}
          onPress={() =>
            setFilter("all")
          }
        />
        <FilterChip
          label="Tem"
          active={filter === "owned"}
          onPress={() =>
            setFilter("owned")
          }
        />
        <FilterChip
          label="Quer jogar"
          active={
            filter === "wishlist"
          }
          onPress={() =>
            setFilter("wishlist")
          }
        />
        <FilterChip
          label="Ambos têm"
          active={filter === "common"}
          onPress={() =>
            setFilter("common")
          }
        />
      </ScrollView>

      {filtered.length === 0 ? (
        <Text
          style={[
            styles.muted,
            styles.filterEmpty,
          ]}
        >
          Nenhum jogo com este filtro.
        </Text>
      ) : (
        <View
          style={
            styles.collectionGrid
          }
        >
          {filtered.map((game) => (
            <CollectionGridItem
              key={game.id}
              game={game}
              bothOwn={myOwnedIds.has(
                game.gameId
              )}
              onPress={() =>
                onOpenGame(game.gameId)
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

function CollectionGridItem({
  game,
  bothOwn,
  onPress,
}: {
  game: UserGameLibrary;
  bothOwn: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.collectionGridItem}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={styles.collectionCoverWrap}
      >
        {game.gameImageUrl ? (
          <Image
            source={{
              uri: game.gameImageUrl,
            }}
            style={styles.collectionCover}
          />
        ) : (
          <View
            style={[
              styles.collectionCover,
              styles.coverPlaceholder,
            ]}
          >
            <Ionicons
              name="dice-outline"
              size={28}
              color={COLORS.textMuted}
            />
          </View>
        )}

        {bothOwn && (
          <View
            style={
              styles.bothOwnBadge
            }
          >
            <Ionicons
              name="people"
              size={11}
              color="#FFFFFF"
            />
          </View>
        )}
      </View>

      <Text
        style={styles.collectionGameName}
        numberOfLines={2}
      >
        {game.gameName}
      </Text>

      <Text
        style={[
          styles.collectionGameStatus,
          bothOwn &&
            styles.collectionGameStatusCommon,
        ]}
        numberOfLines={1}
      >
        {bothOwn
          ? "Também tens"
          : statusLabel(game.status)}
      </Text>
    </TouchableOpacity>
  );
}

function statusLabel(
  status: GameLibraryStatus
) {
  const key =
    getStatusTranslationKey(status);

  if (key === "status.owned") {
    return "Na coleção";
  }

  if (key === "status.played") {
    return "Já jogou";
  }

  if (key === "status.wishlist") {
    return "Quer jogar";
  }

  return "—";
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && styles.chipActive,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.chipText,
          active &&
            styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

function duration(minutes: number) {
  const hours =
    Math.floor(minutes / 60);
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

function formatMonth(value: string) {
  return new Intl.DateTimeFormat(
    "pt-PT",
    {
      month: "long",
      year: "numeric",
    }
  ).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-PT",
    {
      day: "numeric",
      month: "short",
    }
  ).format(new Date(value));
}

function resultText(
  result: string,
  name: string
) {
  return result === "teamWin"
    ? "Vitória em equipa"
    : result === "teamLoss"
      ? "Derrota em equipa"
      : result ===
          "currentUserWin"
        ? "Tu venceste"
        : result ===
            "otherUserWin"
          ? name
            ? `${name} venceu`
            : "O teu amigo venceu"
          : "Empate";
}

function ProfileSkeleton() {
  return (
    <SafeAreaView
      style={styles.screen}
    >
      <View
        style={styles.skeletonProfile}
      >
        <View
          style={styles.skeletonAvatar}
        />
        <View
          style={styles.skeletonInfo}
        >
          <View
            style={
              styles.skeletonTitle
            }
          />
          <View
            style={
              styles.skeletonSubtitle
            }
          />
        </View>
      </View>

      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={styles.skeletonCard}
        />
      ))}
    </SafeAreaView>
  );
}

const cardShadow = {
  shadowColor: "#0B1220",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.055,
  shadowRadius: 10,
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor:
      COLORS.background,
  },

  tabLoading: {
    paddingVertical: 50,
    alignItems: "center",
  },

  tabSection: {
    paddingTop: 4,
  },

  profileHeader: {
    paddingVertical: 8,
  },

  profileTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
  },

  identityRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },

  largeAvatarWrap: {
    position: "relative",
  },

  largeAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      `${COLORS.primary}18`,
  },

  largeAvatarText: {
    fontSize: 24,
    fontWeight: "800",
  },

  identityText: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  username: {
    color: COLORS.textMuted,
    marginTop: 2,
    fontSize: 13,
  },

  friendsSince: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 5,
  },

  action: {
    marginTop: 16,
  },

  primaryButton: {
    marginTop: 16,
    backgroundColor:
      COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 11,
    alignSelf: "flex-start",
  },

  primaryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  disabledButton: {
    marginTop: 16,
    backgroundColor:
      COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 11,
    alignSelf: "flex-start",
  },

  disabledText: {
    color: COLORS.textMuted,
    fontWeight: "700",
  },

  profileStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderTopColor:
      COLORS.border,
  },

  profileStat: {
    flex: 1,
    alignItems: "center",
  },

  profileStatValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  profileStatLabel: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  tabsBar: {
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 10,
    backgroundColor:
      COLORS.surface,
    padding: 4,
    borderRadius: 12,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 9,
  },

  tabButtonActive: {
    backgroundColor:
      COLORS.card,
    ...cardShadow,
  },

  tabButtonText: {
    color: COLORS.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },

  tabButtonTextActive: {
    color: COLORS.primary,
  },

  relationshipCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor:
      COLORS.card,
    ...cardShadow,
  },

  relationshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textMuted,
  },

  relationshipTitle: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  statsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      `${COLORS.primary}10`,
  },

  statsLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  relationshipStats: {
    flexDirection: "row",
    marginTop: 18,
  },

  compactStat: {
    flex: 1,
    alignItems: "center",
  },

  compactStatValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  compactStatLabel: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.textMuted,
  },

  section: {
    marginTop: 22,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  sectionSeeAll: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  sharedGamesRow: {
    paddingRight: 10,
  },

  sharedGameCard: {
    width: 108,
    marginRight: 12,
  },

  sharedGameCover: {
    width: 108,
    height: 108,
    borderRadius: 14,
    backgroundColor:
      COLORS.surface,
  },

  sharedGameName: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  sharedGameMeta: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textMuted,
  },

  listCard: {
    backgroundColor:
      COLORS.card,
    borderRadius: 17,
    paddingHorizontal: 12,
    ...cardShadow,
  },

  compactMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor:
      COLORS.border,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  matchIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      `${COLORS.primary}0D`,
  },

  compactMatchInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  compactMatchGame: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  compactMatchMeta: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  commonGamesRow: {
    paddingRight: 10,
  },

  commonGameCard: {
    width: 96,
    marginRight: 12,
  },

  commonGameCover: {
    width: 96,
    height: 96,
    borderRadius: 13,
    backgroundColor:
      COLORS.surface,
  },

  commonGameName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  commonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },

  commonBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.primary,
  },

  privateCard: {
    marginTop: 22,
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.card,
    ...cardShadow,
  },

  privateIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.surface,
    marginRight: 12,
  },

  privateTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  privateText: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  emptyCard: {
    marginTop: 20,
    padding: 26,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor:
      COLORS.card,
    gap: 4,
    ...cardShadow,
  },

  emptyTitle: {
    marginTop: 10,
    fontWeight: "800",
    color: COLORS.onBackground,
    textAlign: "center",
  },

  muted: {
    marginTop: 6,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  tabHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 12,
  },

  tabHeading: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  tabSubheading: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    ...cardShadow,
  },

  gameImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor:
      COLORS.surface,
  },

  gameImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.surface,
  },

  rowInfo: {
    flex: 1,
    marginLeft: 11,
  },

  rowTitle: {
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  rowMeta: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  rowMetaSecondary: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  loadMoreButton: {
    marginTop: 6,
    marginBottom: 10,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor:
      COLORS.surface,
  },

  loadMoreText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  collectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.onBackground,
    marginTop: 6,
  },

  collectionCount: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 12,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 13,
    marginTop: 14,
    minHeight: 48,
    ...cardShadow,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.onBackground,
    fontSize: 14,
  },

  filterRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 2,
    paddingRight: 10,
  },

  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor:
      COLORS.surface,
  },

  chipActive: {
    backgroundColor:
      `${COLORS.primary}18`,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },

  chipTextActive: {
    color: COLORS.primary,
  },

  filterEmpty: {
    marginTop: 18,
    textAlign: "center",
  },

  collectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
    marginTop: 12,
  },

  collectionGridItem: {
    width: "48%",
    marginBottom: 18,
  },

  collectionCoverWrap: {
    position: "relative",
  },

  collectionCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor:
      COLORS.surface,
  },

  bothOwnBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.primary,
  },

  collectionGameName: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  collectionGameStatus: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
  },

  collectionGameStatusCommon: {
    color: COLORS.primary,
  },

  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  skeletonProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 18,
  },

  skeletonAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor:
      COLORS.surface,
  },

  skeletonInfo: {
    flex: 1,
    marginLeft: 14,
  },

  skeletonTitle: {
    width: 150,
    height: 18,
    borderRadius: 8,
    backgroundColor:
      COLORS.surface,
  },

  skeletonSubtitle: {
    width: 100,
    height: 12,
    borderRadius: 6,
    backgroundColor:
      COLORS.surface,
    marginTop: 8,
  },

  skeletonCard: {
    height: 115,
    borderRadius: 16,
    backgroundColor:
      COLORS.surface,
    marginHorizontal: 16,
    marginTop: 20,
  },
});
