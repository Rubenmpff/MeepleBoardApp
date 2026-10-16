export const ROUTES = {
  STATISTICS: "/statistics",

  HOME: "/dashboard",

  GAME_DETAILS: "/games/details/[id]",


  GAME_DURATIONS: "/games/durations/[id]",

  SEARCH_GAMES: "/games/search",

  REGISTER_MATCH: "/games/register-match",

  LIBRARY: "/(app)/(tabs)/(library)/library",

  PENDING_JOURNAL: "/games/pending-journal",

  RANKINGS: "/games/rankings",

  SESSIONS: "/games/sessions",

  SESSION_DETAIL: "/games/sessions/[id]",

  SESSION_CREATE: "/games/sessions/create",

  PLAY: "/(app)/(tabs)/(play)/play",

  ME: "/(app)/(tabs)/(me)/me",

  MATCH_DETAILS: "/games/matches/[id]",

  MATCH_JOURNAL: "/games/matches/[id]/journal",

  MATCH_PUBLISH: "/games/matches/[id]/publish",

  GAME_EXPERIENCES: "/games/experiences/[id]",

  EXPERIENCE_MODERATION: "/games/experiences/moderation",

  // ── Recursos dos jogos
  RESOURCE_FORM: "/games/resources/form",

  RESOURCE_ADMIN: "/games/resources/admin",

  // ── Campanhas
  CAMPAIGNS: "/(app)/games/campaigns",

  CAMPAIGN_DETAIL: "/(app)/games/campaigns/[id]",

  CAMPAIGN_CREATE: "/(app)/games/campaigns/create",

  // ── Amigos
  FRIENDS: "/(app)/(tabs)/(me)/people",

  FRIEND_REQUESTS: "/friends/requests",

  FRIEND_SEARCH: "/friends/search",

  USER_PROFILE: "/friends/[id]",

  FRIEND_GAME_HISTORY: "/friends/[id]/games/[gameId]",

  MORE: "/(app)/(tabs)/(more)/more",

  SETTINGS: "/settings",

  ABOUT: "/about",

  PROFILE: "/(app)/(tabs)/(me)/me",

  SIGN_IN: "/(auth)/signin",
} as const;

export type RoutePath =
  (typeof ROUTES)[keyof typeof ROUTES];