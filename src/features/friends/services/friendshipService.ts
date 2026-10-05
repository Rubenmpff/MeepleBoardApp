import api from "@/src/services/api";

export type FriendLite = {
  id: string;
  userName: string;
  profilePictureUrl?: string | null;
  sharedMatchesCount: number;
  lastPlayedAt?: string | null;
  mostPlayedGame?: string | null;
  /** Se este amigo fez algum pedido à API nos últimos 5 minutos. */
  isOnline: boolean;
};

export type RelationshipStatus =
  | "none"
  | "friends"
  | "outgoingPending"
  | "incomingPending"
  | "blocked";

export type IncomingFriendRequest = {
  requestId: string;
  fromUserId: string;
  fromUserName: string;
  createdAt: string;
};

export type OutgoingFriendRequest = {
  requestId: string;
  toUserId: string;
  toUserName: string;
  createdAt: string;
};

export type UserSearchResult = {
  id: string;
  userName: string;
  profilePictureUrl?: string | null;
  relationshipStatus: RelationshipStatus;
  requestId?: string | null;
  /** Se este utilizador fez algum pedido à API nos últimos 5 minutos. */
  isOnline: boolean;
};

export type SharedGame = {
  gameId: string;
  name: string;
  imageUrl?: string | null;
  matchesCount: number;
  currentUserWins: number;
  otherUserWins: number;
  teamWins: number;
  isCooperative: boolean;
};

export type SharedMatch = {
  matchId: string;
  gameId: string;
  gameName: string;
  imageUrl?: string | null;
  matchDate: string;
  result: "teamWin" | "teamLoss" | "currentUserWin" | "otherUserWin" | "draw";
};

export type SharedSession = {
  sessionId: string;
  name: string;
  date: string;
  matchesCount: number;
};

/** Privacidade da coleção — espelha o backend (string legível, não o enum numérico). */
export type LibraryPrivacyLabel = "Private" | "FriendsOnly" | "Public";

export type UserProfile = UserSearchResult & {
  friendsSince?: string | null;
  totalMatches: number;
  totalGamesPlayed: number;
  totalGamesOwned: number;
  sharedMatches: number;
  sharedGames: number;
  sharedMinutes: number;
  sharedSessions: number;
  currentUserWins: number;
  otherUserWins: number;
  draws: number;
  topSharedGames: SharedGame[];
  commonOwnedGames: SharedGame[];
  recentSharedMatches: SharedMatch[];
  recentSharedSessions: SharedSession[];
  /** Privacidade da coleção deste utilizador. */
  libraryPrivacy: LibraryPrivacyLabel;
  /** Se eu (quem pede o perfil) posso ver a coleção deste utilizador. */
  canViewLibrary: boolean;
};

/** Partida partilhada com detalhe — usado na tab Partidas e no histórico por jogo. */
export type SharedMatchDetail = {
  matchId: string;
  gameId: string;
  gameName: string;
  imageUrl?: string | null;
  matchDate: string;
  result: "teamWin" | "teamLoss" | "currentUserWin" | "otherUserWin" | "draw";
  durationInMinutes?: number | null;
  location?: string | null;
  currentUserScore?: number | null;
  otherUserScore?: number | null;
};

export type SharedMatchesPage = {
  items: SharedMatchDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const getMyFriends =
  async (): Promise<FriendLite[]> => {
    const response =
      await api.get<FriendLite[]>(
        "/friendships"
      );

    return response.data ?? [];
  };

export async function getIncomingRequests(): Promise<IncomingFriendRequest[]> {
  const response = await api.get<IncomingFriendRequest[]>("/friendships/requests/incoming");
  return response.data ?? [];
}

export async function getOutgoingRequests(): Promise<OutgoingFriendRequest[]> {
  const response = await api.get<OutgoingFriendRequest[]>("/friendships/requests/outgoing");
  return response.data ?? [];
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const response = await api.get<UserSearchResult[]>("/friendships/search", { params: { query } });
  return response.data ?? [];
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await api.get<UserProfile>(`/friendships/profile/${userId}`);
  return response.data;
}

/** Partidas partilhadas paginadas (tab "Partidas" do perfil de amigo). Só entre amigos. */
export async function getSharedMatches(
  userId: string,
  page = 0,
  pageSize = 20
): Promise<SharedMatchesPage> {
  const response = await api.get<SharedMatchesPage>(`/friendships/${userId}/matches`, {
    params: { page, pageSize },
  });
  return response.data;
}

/** Histórico partilhado de um jogo específico ("Histórico em conjunto"). Só entre amigos. */
export async function getSharedMatchesForGame(
  userId: string,
  gameId: string
): Promise<SharedMatchDetail[]> {
  const response = await api.get<SharedMatchDetail[]>(`/friendships/${userId}/matches/game/${gameId}`);
  return response.data ?? [];
}

export async function sendFriendRequest(userId: string): Promise<void> {
  await api.post(`/friendships/request/${userId}`);
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await api.post(`/friendships/accept/${requestId}`);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await api.post(`/friendships/reject/${requestId}`);
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await api.delete(`/friendships/request/${requestId}`);
}

export async function removeFriend(userId: string): Promise<void> {
  await api.delete(`/friendships/${userId}`);
}