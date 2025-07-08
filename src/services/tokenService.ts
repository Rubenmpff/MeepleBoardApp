// src/services/tokenService.ts

import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import getEnvVars from "../constants/env";

const { API_URL } = getEnvVars();

interface JwtPayload {
  exp: number;
  [key: string]: any;
}

export const tokenService = {
  /**
   * 💾 Armazena os tokens e a flag rememberMe.
   * - O accessToken é sempre guardado para manter a sessão ativa.
   * - O refreshToken só é guardado se o rememberMe estiver ativo.
   */
  storeTokens: async (
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean
  ) => {
    console.log("💾 Guardando tokens | Remember me:", rememberMe);

    // Guarda a flag de sessão persistente
    await SecureStore.setItemAsync("remember_me", rememberMe ? "true" : "false");

    // Guardamos SEMPRE o accessToken (para manter a sessão atual ativa)
    await SecureStore.setItemAsync("secure_token", accessToken);

    if (rememberMe) {
      // Sessão persistente → também guardamos o refreshToken
      await SecureStore.setItemAsync("secure_refresh_token", refreshToken);
      console.log("🔐 Access + Refresh guardados (remember = true)");
    } else {
      // Sessão temporária → apenas accessToken fica guardado
      await SecureStore.deleteItemAsync("secure_refresh_token");
      console.log("🧪 Sessão temporária → só accessToken armazenado");
    }
  },

  /**
   * ♻️ Tenta renovar o accessToken usando o refreshToken.
   * Só tenta se rememberMe estiver ativo.
   */
  refreshAccessToken: async (): Promise<string | null> => {
    try {
      const remember = await SecureStore.getItemAsync("remember_me");

      if (remember !== "true") {
        console.log("🔒 Refresh bloqueado → remember_me está false");
        return null;
      }

      const refreshToken = await SecureStore.getItemAsync("secure_refresh_token");

      if (!refreshToken) {
        throw new Error("❌ Refresh token não encontrado.");
      }

      console.log("♻️ Tentando refresh com refreshToken:", refreshToken);

      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken,
      });

      const { token, refreshToken: newRefresh } = response.data;

      if (!token || !newRefresh) {
        throw new Error("❌ Resposta inválida ao tentar refrescar token.");
      }

      // Armazena os novos tokens, mantendo remember ativo
      await tokenService.storeTokens(token, newRefresh, true);
      console.log("✅ Token refrescado com sucesso!");
      return token;
    } catch (error) {
      console.warn("❌ Erro ao tentar refrescar token:", error);
      await tokenService.clearAll();
      return null;
    }
  },

  /**
   * 🧹 Limpa todos os dados da sessão do utilizador.
   */
  clearAll: async () => {
    console.log("🧹 Limpando dados de sessão...");
    await Promise.all([
      SecureStore.deleteItemAsync("secure_token"),
      SecureStore.deleteItemAsync("secure_refresh_token"),
      SecureStore.deleteItemAsync("remember_me"),
      SecureStore.deleteItemAsync("current_user"),
    ]);
    console.log("✅ Todos os dados de sessão foram removidos");
  },

  /**
   * 🔍 Verifica se o token atual ainda é válido.
   * Se estiver expirado, tenta refrescar.
   */
  getValidToken: async (): Promise<string | null> => {
    const token = await SecureStore.getItemAsync("secure_token");
    console.log("🔍 Verificando token guardado:", token);

    if (!token) {
      console.warn("⚠️ Nenhum token encontrado");
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const now = Date.now() / 1000;

      console.log("📅 Token expira em:", decoded.exp, "| Agora:", now);

      if (decoded.exp && decoded.exp > now) {
        console.log("✅ Token ainda válido");
        return token;
      }

      console.log("⚠️ Token expirado → tentando refresh...");
      return await tokenService.refreshAccessToken();
    } catch (err) {
      console.warn("❌ Erro ao decodificar o token:", err);
      return null;
    }
  },
};
