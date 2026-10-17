// src/services/api.ts

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import i18n from "i18next";
import { formatDate } from "../ui/format";
import getEnvVars from "../constants/env";
import { tokenService } from "./tokenService";

const { API_URL, API_MODE } = getEnvVars();

export const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: 15000,
});

// ======================================================
// DEBUG DE AMBIENTE
// ======================================================
//
// Em builds de desenvolvimento/QA ajuda a confirmar
// imediatamente para que API a app está a apontar.
//
// Não imprime tokens nem dados sensíveis.

if (__DEV__) {
  console.log("🌍 API environment:", API_MODE);
  console.log("🌍 API base URL:", API_URL);
}

// ======================================================
// ENDPOINTS PÚBLICOS DE AUTENTICAÇÃO
// ======================================================
//
// Estes endpoints não precisam de access token.
// Também não devem tentar fazer refresh antes do login.

const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/confirm-email",
  "/auth/resend-confirmation",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh-token",
];

function isPublicAuthEndpoint(
  url?: string
): boolean {
  if (!url) {
    return false;
  }

  return PUBLIC_AUTH_ENDPOINTS.some(
    (endpoint) =>
      url.startsWith(endpoint)
  );
}

// ======================================================
// REFRESH CONTROL
// ======================================================

let isRefreshing = false;

let refreshQueue: Array<
  (token: string | null) => void
> = [];

// ======================================================
// HELPERS
// ======================================================

function ensureHeaders(
  config: InternalAxiosRequestConfig
) {
  config.headers =
    config.headers ?? {};

  return config;
}

// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

api.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ) => {
    config = ensureHeaders(config);

    // Não adicionar JWT a endpoints públicos.
    if (
      isPublicAuthEndpoint(
        config.url
      )
    ) {
      return config;
    }

    const token =
      await tokenService.getValidToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(
  (response) => response,

  async (
    error: AxiosError
  ) => {
    const originalRequest =
      error.config as
        | (AxiosRequestConfig & {
            _retry?: boolean;
          })
        | undefined;

    // Sem config original não conseguimos repetir.
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Não tentar refresh nos endpoints públicos.
    if (
      isPublicAuthEndpoint(
        originalRequest.url
      )
    ) {
      return Promise.reject(error);
    }

    // Refresh apenas em 401.
    if (
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    // Evita loop infinito.
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ==================================================
    // JÁ EXISTE REFRESH EM CURSO
    // ==================================================

    if (isRefreshing) {
      return new Promise(
        (resolve, reject) => {
          refreshQueue.push(
            (newToken) => {
              if (!newToken) {
                reject(error);
                return;
              }

              originalRequest.headers =
                originalRequest.headers ?? {};

              (
                originalRequest.headers as Record<
                  string,
                  string
                >
              ).Authorization =
                `Bearer ${newToken}`;

              resolve(
                api(originalRequest)
              );
            }
          );
        }
      );
    }

    // ==================================================
    // INICIAR REFRESH
    // ==================================================

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken =
        await tokenService.refreshAccessToken();

      refreshQueue.forEach(
        (callback) =>
          callback(newToken)
      );

      refreshQueue = [];

      if (!newToken) {
        await tokenService.clearAll();

        return Promise.reject(error);
      }

      originalRequest.headers =
        originalRequest.headers ?? {};

      (
        originalRequest.headers as Record<
          string,
          string
        >
      ).Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach(
        (callback) =>
          callback(null)
      );

      refreshQueue = [];

      await tokenService.clearAll();

      return Promise.reject(
        refreshError
      );
    } finally {
      isRefreshing = false;
    }
  }
);

// ======================================================
// MENSAGENS DE ERRO PARA PESSOAS
// ======================================================

// Texto que não deve chegar a ninguém: mensagens do axios, exceções, páginas HTML.
const TECHNICAL = /request failed|status code|network error|exception|stack|system\.|<html|sql|\n\s+at /i;

/** True for text that must not reach people (axios messages, exceptions, HTML, very long texts). */
export function isTechnicalText(text: string): boolean {
  return text.length > 300 || TECHNICAL.test(text);
}

function serverText(data: any): string | null {
  const text = typeof data === "string" ? data : typeof data?.message === "string" ? data.message : null;
  return text && text.trim() && !isTechnicalText(text) ? text.trim() : null;
}

/**
 * A message for people, in the app language, never technical.
 * - Without an answer: network or timeout.
 * - In Portuguese, the API's own explanation (written for people, in Portuguese), when it has one.
 * - Otherwise by status, or the given context message for invalid data and conflicts (e.g. «Não foi possível publicar»).
 * Request errors are worked out again each time, so a context message given by the screen is used; other errors
 * (thrown by the app with its own translated text) keep their message.
 */
export function friendlyErrorMessage(error: unknown, fallback?: string): string {
  const e = error as any;
  const t = (key: string) => i18n.t(`common:errors.${key}`);
  if (!e?.isAxiosError) return typeof e?.message === "string" && e.message.trim() && !TECHNICAL.test(e.message) ? e.message : fallback ?? t("generic");
  if (!e.response) return e.code === "ECONNABORTED" ? t("timeout") : t("network");
  const status: number = e.response.status;
  // Server failures always get the app's own text: the server only sends a generic line there.
  if (status >= 500) return t("server");
  const own = serverText(e.response.data);
  if (own && (i18n.language ?? "").startsWith("pt")) return own;
  if (status === 401) return t("unauthorized");
  if (status === 403) return t("forbidden");
  if (status === 404) return t("notFound");
  if (status === 429) return t("tooMany");
  if (status >= 500) return t("server");
  return fallback ?? t(status === 409 ? "conflict" : status === 400 ? "invalid" : "generic");
}

// ======================================================
// CONTAS ELIMINADAS
// ======================================================

// A deleted account keeps a neutral marker as its name (never text in one language): shown translated.
// So do the titles it wrote in shared records: sessions it organized and campaigns it created.
const DELETED_ACCOUNT = /^deleted:[0-9a-f]{8}$/;
const DELETED_SESSION = /^deleted:session:(\d{4})-(\d{2})-(\d{2})$/;
const DELETED_CAMPAIGN = "deleted:campaign";

function presentMarker(text: string): string | null {
  if (DELETED_ACCOUNT.test(text)) return i18n.t("common:deletedAccount");
  if (text === DELETED_CAMPAIGN) return i18n.t("common:deletedCampaign");
  const session = DELETED_SESSION.exec(text);
  if (session) return i18n.t("common:deletedSession", { date: formatDate(new Date(+session[1], +session[2] - 1, +session[3]), i18n.language) });
  return null;
}

/** Replaces deleted-account markers with their translation, only in fields that hold a name. */
export function presentDeletedAccounts<T>(data: T): T {
  const visit = (value: any): any => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== "object") return value;
    const out: any = {};
    for (const [key, item] of Object.entries(value))
      out[key] = typeof item === "string" && /name$/i.test(key) ? presentMarker(item) ?? item : visit(item);
    return out;
  };
  return visit(data);
}

api.interceptors.response.use((response) => {
  if (response?.data && typeof response.data === "object") response.data = presentDeletedAccounts(response.data);
  return response;
});

// Every failed request carries a friendly message; cancellations stay untouched (callers recognise «canceled»).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && !axios.isCancel(error) && error.isAxiosError && !error.friendly) {
      error.technicalMessage = error.message;
      error.message = friendlyErrorMessage(error);
      error.friendly = true;
    }
    return Promise.reject(error);
  }
);

export default api;
