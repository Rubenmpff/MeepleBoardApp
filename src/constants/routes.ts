export const ROUTES = {
  HOME: "/dashboard",

  GAME_DETAILS: "/games/details/[id]",

  SEARCH_GAMES: "/games/search",

  REGISTER_MATCH: "/games/register-match",

  LIBRARY: "/games/library",

  PENDING_JOURNAL: "/games/pending-journal",

  RANKINGS: "/games/rankings",

  SESSIONS: "/games/sessions",

  SESSION_DETAIL: "/games/sessions/[id]",

  MATCH_DETAILS: "/games/matches/[id]",

  MATCH_JOURNAL: "/games/matches/[id]/journal",

  // ── Campanhas
  CAMPAIGNS: "/(app)/games/campaigns",

  CAMPAIGN_DETAIL: "/(app)/games/campaigns/[id]",

  CAMPAIGN_CREATE: "/(app)/games/campaigns/create",

  // ── Amigos
  FRIENDS: "/friends",

  FRIEND_REQUESTS: "/friends/requests",

  FRIEND_SEARCH: "/friends/search",

  USER_PROFILE: "/friends/[id]",

  FRIEND_GAME_HISTORY: "/friends/[id]/games/[gameId]",

  SETTINGS: "/settings",

  PROFILE: "/profile",

  SIGN_IN: "/(auth)/signin",
} as const;

export type RoutePath =
  (typeof ROUTES)[keyof typeof ROUTES];