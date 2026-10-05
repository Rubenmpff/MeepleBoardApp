// src/services/tokenService.ts

import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import getEnvVars from "../constants/env";

const { API_URL } = getEnvVars();

// ======================================================
// CHAVES DO SECURE STORE
// ======================================================

const ACCESS_TOKEN_KEY = "secure_token";
const REFRESH_TOKEN_KEY = "secure_refresh_token";
const REMEMBER_ME_KEY = "remember_me";
const CURRENT_USER_KEY = "current_user";

// ======================================================
// SESSÃO TEMPORÁRIA
// ======================================================
//
// Quando "Remember me" está desligado, o access token
// fica apenas em memória.
//
// Assim:
// - enquanto a app estiver aberta → sessão funciona;
// - ao fechar completamente a app → precisa de login novamente.

let temporaryAccessToken: string | null = null;

// ======================================================
// REFRESH CONTROL
// ======================================================
//
// Evita vários refreshes simultâneos.
//
// Isto é especialmente importante porque o backend faz
// rotação do Refresh Token:
//
// Refresh A → invalida token antigo → cria token novo
//
// Sem este controlo, dois pedidos simultâneos poderiam
// tentar utilizar o mesmo Refresh Token antigo.

let refreshPromise: Promise<string | null> | null = null;

// ======================================================
// TIPOS
// ======================================================

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

interface RefreshTokenResponse {
  success?: boolean;
  token?: string;
  refreshToken?: string;
}

// ======================================================
// HELPERS
// ======================================================

function isTokenExpired(token: string): boolean {
  try {
    const decoded =
      jwtDecode<JwtPayload>(token);

    if (!decoded.exp) {
      return true;
    }

    const now =
      Math.floor(Date.now() / 1000);

    /*
     * Margem de segurança.
     *
     * Não utilizamos um token que está a poucos
     * segundos de expirar.
     */
    const expirationSafetyWindow = 30;

    return (
      decoded.exp <=
      now + expirationSafetyWindow
    );
  } catch {
    return true;
  }
}

// ======================================================
// REFRESH INTERNO
// ======================================================

async function performRefresh(): Promise<string | null> {
  const rememberMe =
    await tokenService.isRememberMeEnabled();

  if (!rememberMe) {
    return null;
  }

  const refreshToken =
    await SecureStore.getItemAsync(
      REFRESH_TOKEN_KEY
    );

  if (!refreshToken) {
    await tokenService.clearAll();
    return null;
  }

  try {
    /*
     * IMPORTANTE:
     *
     * Usamos axios diretamente.
     *
     * Não usamos a instância "api" porque essa instância
     * contém interceptors de autenticação e poderia
     * provocar ciclos de refresh.
     */

    const response =
      await axios.post<RefreshTokenResponse>(
        `${API_URL}/auth/refresh-token`,
        {
          refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          timeout: 15000,
        }
      );

    const newAccessToken =
      response.data?.token;

    const newRefreshToken =
      response.data?.refreshToken;

    /*
     * O backend da MeepleBoard faz rotação de
     * Refresh Tokens.
     *
     * Por isso esperamos SEMPRE:
     *
     * - novo access token
     * - novo refresh token
     */

    if (
      !newAccessToken ||
      !newRefreshToken
    ) {
      await tokenService.clearAll();
      return null;
    }

    await tokenService.storeTokens(
      newAccessToken,
      newRefreshToken,
      true
    );

    return newAccessToken;
  } catch (error) {
    /*
     * É importante distinguir:
     *
     * 1. Backend respondeu 400/401/403
     *    → refresh token inválido/expirado
     *    → terminar sessão.
     *
     * 2. Não houve resposta
     *    → pode ser internet, timeout, Azure indisponível...
     *    → NÃO apagar imediatamente a sessão.
     *
     * Assim podemos tentar novamente quando a ligação voltar.
     */

    if (axios.isAxiosError(error)) {
      const status =
        error.response?.status;

      if (
        status === 400 ||
        status === 401 ||
        status === 403
      ) {
        await tokenService.clearAll();
      }

      if (__DEV__) {
        console.warn(
          "Não foi possível renovar a sessão.",
          {
            status,
            code: error.code,
            message: error.message,
          }
        );
      }

      return null;
    }

    if (__DEV__) {
      console.warn(
        "Erro inesperado ao renovar a sessão."
      );
    }

    return null;
  }
}

// ======================================================
// TOKEN SERVICE
// ======================================================

export const tokenService = {
  // ====================================================
  // STORE TOKENS
  // ====================================================

  storeTokens: async (
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean
  ): Promise<void> => {
    if (rememberMe) {
      /*
       * Sessão persistente.
       *
       * Access Token + Refresh Token ficam protegidos
       * pelo SecureStore.
       */

      temporaryAccessToken = null;

      await Promise.all([
        SecureStore.setItemAsync(
          ACCESS_TOKEN_KEY,
          accessToken
        ),

        SecureStore.setItemAsync(
          REFRESH_TOKEN_KEY,
          refreshToken
        ),

        SecureStore.setItemAsync(
          REMEMBER_ME_KEY,
          "true"
        ),
      ]);

      return;
    }

    /*
     * Sessão temporária.
     *
     * O access token existe apenas enquanto
     * este processo da app estiver vivo.
     */

    temporaryAccessToken =
      accessToken;

    await Promise.all([
      SecureStore.deleteItemAsync(
        ACCESS_TOKEN_KEY
      ),

      SecureStore.deleteItemAsync(
        REFRESH_TOKEN_KEY
      ),

      SecureStore.setItemAsync(
        REMEMBER_ME_KEY,
        "false"
      ),
    ]);
  },

  // ====================================================
  // ACCESS TOKEN
  // ====================================================

  getAccessToken:
    async (): Promise<string | null> => {
      /*
       * Primeiro verificamos se existe uma
       * sessão temporária em memória.
       */

      if (temporaryAccessToken) {
        return temporaryAccessToken;
      }

      /*
       * Caso contrário procuramos uma sessão
       * persistente no SecureStore.
       */

      return SecureStore.getItemAsync(
        ACCESS_TOKEN_KEY
      );
    },

  // ====================================================
  // REFRESH TOKEN
  // ====================================================

  getRefreshToken:
    async (): Promise<string | null> => {
      return SecureStore.getItemAsync(
        REFRESH_TOKEN_KEY
      );
    },

  // ====================================================
  // REMEMBER ME
  // ====================================================

  isRememberMeEnabled:
    async (): Promise<boolean> => {
      const value =
        await SecureStore.getItemAsync(
          REMEMBER_ME_KEY
        );

      return value === "true";
    },

  // ====================================================
  // REFRESH ACCESS TOKEN
  // ====================================================

  refreshAccessToken:
    async (): Promise<string | null> => {
      /*
       * Se já existe um refresh em andamento,
       * todos os pedidos aguardam pelo MESMO refresh.
       */

      if (refreshPromise) {
        return refreshPromise;
      }

      refreshPromise =
        performRefresh();

      try {
        return await refreshPromise;
      } finally {
        refreshPromise = null;
      }
    },

  // ====================================================
  // GET VALID TOKEN
  // ====================================================

  getValidToken:
    async (): Promise<string | null> => {
      const accessToken =
        await tokenService.getAccessToken();

      if (!accessToken) {
        return null;
      }

      // Token ainda válido.
      if (!isTokenExpired(accessToken)) {
        return accessToken;
      }

      // ==================================================
      // TOKEN TEMPORÁRIO EXPIRADO
      // ==================================================

      const rememberMe =
        await tokenService
          .isRememberMeEnabled();

      if (!rememberMe) {
        /*
         * Sem Remember me não existe refresh token.
         *
         * A sessão termina quando o access token expira.
         */

        await tokenService.clearAll();

        return null;
      }

      // ==================================================
      // TOKEN PERSISTENTE EXPIRADO
      // ==================================================
      //
      // Remember me ativo:
      // tentamos obter um novo par de tokens.

      return tokenService
        .refreshAccessToken();
    },

  // ====================================================
  // CLEAR SESSION
  // ====================================================

  clearAll:
    async (): Promise<void> => {
      temporaryAccessToken = null;

      await Promise.all([
        SecureStore.deleteItemAsync(
          ACCESS_TOKEN_KEY
        ),

        SecureStore.deleteItemAsync(
          REFRESH_TOKEN_KEY
        ),

        SecureStore.deleteItemAsync(
          REMEMBER_ME_KEY
        ),

        SecureStore.deleteItemAsync(
          CURRENT_USER_KEY
        ),
      ]);
    },
};