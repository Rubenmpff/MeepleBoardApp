// src/constants/routes.ts
export const ROUTES = {
  HOME: "/dashboard",

  GAME_DETAILS: "/games/details/[id]",

  SEARCH_GAMES: "/games/search",
  REGISTER_MATCH: "/games/register-match",
  LIBRARY: "/games/library",


  SESSIONS: "/games/sessions",       // lista de sessões
  SESSION_DETAIL: "/games/sessions/[id]", // detalhe da sessão

  SETTINGS: "/settings",
  PROFILE: "/profile",
  SIGN_IN: "/(auth)/signin",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
