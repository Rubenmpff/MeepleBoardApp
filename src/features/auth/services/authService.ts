import api from "../../../services/api";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { tokenService } from "@/src/services/tokenService";

interface AuthResponse {
  success: boolean;
  message?: string;
  code?: string;
  token?: string;
  refreshToken?: string;
  errors?: string[];
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  isMobile: boolean;
}

interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export const authService = {
  /**
   * Registo de novo utilizador
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const res = await api.post("/auth/register", data);
      console.log("✅ Utilizador registado com sucesso");
      return { success: true, message: res.data?.message };
    } catch (error) {
      return handleError(error, "register");
    }
  },

  /**
   * Login + guardar tokens e utilizador
   */
  login: async (
    loginData: { email: string; password: string },
    rememberMe: boolean
  ): Promise<AuthResponse> => {
    try {
      const res = await api.post("/auth/login", { ...loginData, isMobile: true });
      console.log("📨 Resposta do login:", res.data);

      const { token, refreshToken, user, success } = res.data;

      if (!success || !token || !refreshToken || !user) {
        return { success: false, message: "Dados inválidos do servidor." };
      }

      // Guardar os tokens de forma segura
      await tokenService.storeTokens(token, refreshToken, rememberMe);

      // Guardar o utilizador na chave correta
      await SecureStore.setItemAsync("current_user", JSON.stringify(user));
      console.log("👤 Utilizador guardado com sucesso:", user);

      return { success: true };
    } catch (err) {
      return handleError(err, "login");
    }
  },

  /**
   * Confirmação de email via token recebido por link
   */
  confirmEmail: async (token: string, email: string): Promise<AuthResponse> => {
    try {
      const cleanedToken = decodeURIComponent(token.trim()).replace(/\s/g, "+");
      const res = await api.get(
        `/auth/confirm-email?token=${encodeURIComponent(cleanedToken)}&email=${encodeURIComponent(email)}`
      );

      console.log("📬 Email confirmado com sucesso.");
      return { success: true, message: res.data?.message };
    } catch (error) {
      return handleError(error, "confirmEmail");
    }
  },

  /**
   * Reenvio de email de confirmação
   */
  resendConfirmationEmail: async (email: string): Promise<AuthResponse> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/resend-confirmation", {
        email: cleanEmail,
        isMobile: true,
      });

      console.log("📤 Email de confirmação reenviado");
      return { success: true, message: res.data?.message };
    } catch (error) {
      return handleError(error, "resendConfirmationEmail");
    }
  },

  /**
   * Pedido de recuperação de password
   */
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/forgot-password", {
        email: cleanEmail,
        isMobile: true,
      });

      console.log("🔐 Email de recuperação enviado");
      return { success: true, message: res.data?.message };
    } catch (error) {
      return handleError(error, "forgotPassword");
    }
  },

  /**
   * Submeter nova password com o token recebido por email
   */
  resetPassword: async (data: ResetPasswordData): Promise<AuthResponse> => {
    try {
      const cleanedToken = decodeURIComponent(data.token.trim()).replace(/\s/g, "+");
      const cleanEmail = data.email.trim().toLowerCase();

      const res = await api.post("/auth/reset-password", {
        token: cleanedToken,
        email: cleanEmail,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      console.log("🔁 Password atualizada com sucesso");
      return { success: true, message: res.data?.message };
    } catch (error) {
      return handleError(error, "resetPassword");
    }
  },

  /**
   * Logout local: remove tudo que foi guardado
   */
  logout: async (): Promise<void> => {
    console.log("🚪 Logout iniciado...");
    await Promise.all([
      SecureStore.deleteItemAsync("secure_token"),
      SecureStore.deleteItemAsync("secure_refresh_token"),
      SecureStore.deleteItemAsync("remember_me"),
      SecureStore.deleteItemAsync("current_user"),
    ]);
    console.log("✅ Logout concluído.");
  },

  /**
   * Logout em todos os dispositivos + limpar local
   */
  logoutAllDevices: async (): Promise<void> => {
    try {
      await api.post("/auth/logout-all");
      console.log("🚫 Logout de todos os dispositivos feito com sucesso.");
    } catch (err) {
      console.warn("⚠️ Erro ao fazer logout de todos os dispositivos:", err);
    }

    await authService.logout();
  },
};

/**
 * Função centralizada para tratar erros de API
 */
const handleError = (error: any, action: string): AuthResponse => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    const message =
      responseData?.errors?.length > 0
        ? `${responseData?.message || ""} ${responseData.errors[0]}`
        : responseData?.message || responseData?.error || `Erro durante ${action}.`;

    const normalizedMessage = message?.toLowerCase();

    // Detecção de erros mais comuns
    let code = undefined;
    if (normalizedMessage.includes("expired") || normalizedMessage.includes("invalid token")) {
      code = "invalid_token";
    } else if (normalizedMessage.includes("email not confirmed")) {
      code = "email_not_confirmed";
    }

    console.warn(`❌ Erro no processo de ${action}:`, message);
    return {
      success: false,
      message: message.trim(),
      code,
      errors: responseData?.errors,
    };
  }

  return {
    success: false,
    message: "Erro inesperado. Verifica a tua ligação à internet.",
  };
};
