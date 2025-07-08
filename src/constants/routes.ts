// src/constants/routes.ts
export const ROUTES = {
  HOME: "/dashboard",                 // se estiver dentro de (app) usa "/(app)/dashboard"
  SEARCH_GAMES: "/games/search",
  REGISTER_MATCH: "/games/register-match",
  LIBRARY: "/games/library",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  SIGN_IN: "/(auth)/signin",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
