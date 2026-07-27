export const ROUTES = {
  HOME: "/dashboard",

  GAME_DETAILS: "/games/details/[id]",

  SEARCH_GAMES: "/games/search",
  REGISTER_MATCH: "/games/register-match",
  LIBRARY: "/games/library",

  SESSIONS: "/games/sessions",
  SESSION_DETAIL: "/games/sessions/[id]",

  // ── Campanhas
  CAMPAIGNS: "/(app)/games/campaigns",
  CAMPAIGN_DETAIL: "/(app)/games/campaigns/[id]",
  CAMPAIGN_CREATE: "/(app)/games/campaigns/create",

  SETTINGS: "/settings",
  PROFILE: "/profile",
  SIGN_IN: "/(auth)/signin",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];