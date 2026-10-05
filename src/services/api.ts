// src/services/api.ts

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

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

export default api;