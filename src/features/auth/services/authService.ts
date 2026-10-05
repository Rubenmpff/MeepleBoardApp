import api from "../../../services/api";
import * as SecureStore from "expo-secure-store";
import axios, { AxiosError } from "axios";

import { tokenService } from "@/src/services/tokenService";
import { store } from "@/src/store/store";
import { setToken } from "@/src/features/auth/store/authSlice";

// ======================================================
// TYPES
// ======================================================

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

interface LoginData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}

interface LoginResponseData {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: unknown;
  message?: string;
}

// ======================================================
// HELPERS
// ======================================================

function normalizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase();
}

function normalizeToken(token: string): string {
  return decodeURIComponent(
    token.trim()
  ).replace(/\s/g, "+");
}

function extractErrors(
  value: unknown
): string[] | undefined {
  if (!value) {
    return undefined;
  }

  // Exemplo:
  // errors: ["erro 1", "erro 2"]
  if (Array.isArray(value)) {
    const errors = value
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map((item) => item.trim())
      .filter(Boolean);

    return errors.length > 0
      ? errors
      : undefined;
  }

  /*
   * ASP.NET ValidationProblemDetails pode devolver:
   *
   * errors: {
   *   Email: ["Email inválido"],
   *   Password: ["Password obrigatória"]
   * }
   */
  if (
    typeof value === "object" &&
    value !== null
  ) {
    const errors =
      Object.values(
        value as Record<string, unknown>
      )
        .flatMap((item) =>
          Array.isArray(item)
            ? item
            : [item]
        )
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map((item) => item.trim())
        .filter(Boolean);

    return errors.length > 0
      ? errors
      : undefined;
  }

  return undefined;
}

// ======================================================
// AUTH SERVICE
// ======================================================

export const authService = {
  // ====================================================
  // REGISTER
  // ====================================================

  register: async (
    data: RegisterData
  ): Promise<AuthResponse> => {
    try {
      const response =
        await api.post(
          "/auth/register",
          {
            ...data,
            username:
              data.username.trim(),

            email:
              normalizeEmail(
                data.email
              ),
          }
        );

      return {
        success: true,
        message:
          response.data?.message ??
          response.data?.Message,
      };
    } catch (error) {
      return handleError(
        error,
        "register"
      );
    }
  },

  // ====================================================
  // LOGIN
  // ====================================================

  login: async (
    loginData: LoginData,
    rememberMe: boolean
  ): Promise<AuthResponse> => {
    try {
      /*
       * O backend espera:
       *
       * {
       *   email,
       *   password,
       *   deviceInfo
       * }
       *
       * Não enviamos isMobile porque o LoginDto
       * atual do backend não necessita desse campo.
       */
      const response =
        await api.post<LoginResponseData>(
          "/auth/login",
          {
            email:
              normalizeEmail(
                loginData.email
              ),

            password:
              loginData.password,

            deviceInfo:
              "MeepleBoard Mobile App",
          }
        );

      const {
        success,
        token,
        refreshToken,
        user,
      } = response.data;

      if (
        !success ||
        !token ||
        !refreshToken ||
        !user
      ) {
        return {
          success: false,
          message:
            "O servidor devolveu uma resposta de autenticação inválida.",
        };
      }

      // ----------------------------------------------
      // GUARDAR TOKENS
      // ----------------------------------------------

      await tokenService.storeTokens(
        token,
        refreshToken,
        rememberMe
      );

      // ----------------------------------------------
      // REDUX
      // ----------------------------------------------

      store.dispatch(
        setToken(token)
      );

      // ----------------------------------------------
      // UTILIZADOR ATUAL
      // ----------------------------------------------

      await SecureStore.setItemAsync(
        "current_user",
        JSON.stringify(user)
      );

      return {
        success: true,
      };
    } catch (error) {
      return handleError(
        error,
        "login"
      );
    }
  },

  // ====================================================
  // CONFIRM EMAIL
  // ====================================================

  confirmEmail: async (
    token: string,
    email: string
  ): Promise<AuthResponse> => {
    try {
      const cleanedToken =
        normalizeToken(token);

      const cleanEmail =
        normalizeEmail(email);

      const response =
        await api.get(
          "/auth/confirm-email",
          {
            params: {
              token:
                cleanedToken,

              email:
                cleanEmail,
            },
          }
        );

      return {
        success: true,
        message:
          response.data?.message ??
          response.data?.Message,
      };
    } catch (error) {
      return handleError(
        error,
        "confirmEmail"
      );
    }
  },

  // ====================================================
  // RESEND EMAIL CONFIRMATION
  // ====================================================

  resendConfirmationEmail:
    async (
      email: string
    ): Promise<AuthResponse> => {
      try {
        const response =
          await api.post(
            "/auth/resend-confirmation",
            {
              email:
                normalizeEmail(
                  email
                ),

              isMobile: true,
            }
          );

        return {
          success: true,
          message:
            response.data?.message ??
            response.data?.Message,
        };
      } catch (error) {
        return handleError(
          error,
          "resendConfirmationEmail"
        );
      }
    },

  // ====================================================
  // FORGOT PASSWORD
  // ====================================================

  forgotPassword:
    async (
      email: string
    ): Promise<AuthResponse> => {
      try {
        const response =
          await api.post(
            "/auth/forgot-password",
            {
              email:
                normalizeEmail(
                  email
                ),

              isMobile: true,
            }
          );

        return {
          success: true,
          message:
            response.data?.message ??
            response.data?.Message,
        };
      } catch (error) {
        return handleError(
          error,
          "forgotPassword"
        );
      }
    },

  // ====================================================
  // RESET PASSWORD
  // ====================================================

  resetPassword:
    async (
      data: ResetPasswordData
    ): Promise<AuthResponse> => {
      try {
        const response =
          await api.post(
            "/auth/reset-password",
            {
              email:
                normalizeEmail(
                  data.email
                ),

              token:
                normalizeToken(
                  data.token
                ),

              password:
                data.password,

              confirmPassword:
                data.confirmPassword,
            }
          );

        return {
          success: true,
          message:
            response.data?.message ??
            response.data?.Message,
        };
      } catch (error) {
        return handleError(
          error,
          "resetPassword"
        );
      }
    },

  // ====================================================
  // LOGOUT
  // ====================================================

  logout:
    async (): Promise<void> => {
      /*
       * Para já fazemos logout local.
       *
       * A limpeza fica centralizada no tokenService,
       * evitando duplicação das chaves do SecureStore.
       */
      await tokenService.clearAll();
    },

  // ====================================================
  // LOGOUT ALL DEVICES
  // ====================================================

  logoutAllDevices:
    async (): Promise<void> => {
      try {
        await api.post(
          "/auth/logout-all"
        );
      } catch (error) {
        /*
         * Mesmo que o backend esteja indisponível,
         * o utilizador deve conseguir terminar
         * a sessão local.
         *
         * Não bloqueamos o logout por causa disso.
         */
        if (__DEV__) {
          console.warn(
            "Não foi possível terminar as sessões remotas.",
            getSafeErrorDetails(error)
          );
        }
      } finally {
        await tokenService.clearAll();
      }
    },
};

// ======================================================
// ERROR HANDLING
// ======================================================

function handleError(
  error: unknown,
  action: string
): AuthResponse {
  if (!axios.isAxiosError(error)) {
    return {
      success: false,
      message:
        "Ocorreu um erro inesperado. Tenta novamente.",
    };
  }

  const axiosError =
    error as AxiosError<any>;

  // ====================================================
  // SEM RESPOSTA DO SERVIDOR
  // ====================================================
  //
  // Exemplos:
  // - Internet desligada
  // - DNS
  // - timeout
  // - servidor indisponível
  // - URL incorreto

  if (!axiosError.response) {
    if (__DEV__) {
      console.warn(
        `API error during ${action}:`,
        getSafeErrorDetails(
          axiosError
        )
      );
    }

    if (
      axiosError.code ===
      "ECONNABORTED"
    ) {
      return {
        success: false,
        code: "timeout",
        message:
          "O servidor demorou demasiado tempo a responder. Tenta novamente.",
      };
    }

    return {
      success: false,
      code: "network_error",
      message:
        "Não foi possível contactar o servidor. Verifica a ligação à internet e tenta novamente.",
    };
  }

  // ====================================================
  // RESPOSTA DO BACKEND
  // ====================================================

  const responseData =
    axiosError.response.data;

  const errors =
    extractErrors(
      responseData?.errors
    );

  const serverMessage =
    typeof responseData?.message ===
    "string"
      ? responseData.message
      : typeof responseData?.Message ===
          "string"
        ? responseData.Message
        : typeof responseData?.error ===
            "string"
          ? responseData.error
          : undefined;

  const message =
    errors?.[0] ??
    serverMessage ??
    getDefaultErrorMessage(
      axiosError.response.status,
      action
    );

  const normalizedMessage =
    message.toLowerCase();

  let code: string | undefined;

  if (
    normalizedMessage.includes(
      "email not confirmed"
    ) ||
    normalizedMessage.includes(
      "email não confirmado"
    )
  ) {
    code =
      "email_not_confirmed";
  } else if (
    normalizedMessage.includes(
      "expired"
    ) ||
    normalizedMessage.includes(
      "invalid token"
    ) ||
    normalizedMessage.includes(
      "token inválido"
    ) ||
    normalizedMessage.includes(
      "token expirado"
    )
  ) {
    code =
      "invalid_token";
  } else if (
    axiosError.response.status ===
    401
  ) {
    code =
      "unauthorized";
  } else if (
    axiosError.response.status ===
    403
  ) {
    code =
      "forbidden";
  } else if (
    axiosError.response.status >=
    500
  ) {
    code =
      "server_error";
  }

  if (__DEV__) {
    console.warn(
      `API error during ${action}:`,
      {
        status:
          axiosError.response
            .status,

        code,

        message,
      }
    );
  }

  return {
    success: false,
    message:
      message.trim(),
    code,
    errors,
  };
}

// ======================================================
// DEFAULT ERROR MESSAGES
// ======================================================

function getDefaultErrorMessage(
  status: number,
  action: string
): string {
  switch (status) {
    case 400:
      return getBadRequestMessage(
        action
      );

    case 401:
      return "A tua sessão não é válida ou as credenciais estão incorretas.";

    case 403:
      return "Não tens permissão para realizar esta operação.";

    case 404:
      return "O recurso solicitado não foi encontrado.";

    case 409:
      return "Não foi possível concluir a operação devido a um conflito de dados.";

    case 429:
      return "Foram efetuados demasiados pedidos. Aguarda um momento e tenta novamente.";

    default:
      if (status >= 500) {
        return "O servidor encontrou um problema. Tenta novamente dentro de momentos.";
      }

      return `Não foi possível concluir ${action}.`;
  }
}

function getBadRequestMessage(
  action: string
): string {
  switch (action) {
    case "login":
      return "Não foi possível iniciar sessão. Confirma o email e a password.";

    case "register":
      return "Não foi possível criar a conta. Confirma os dados introduzidos.";

    case "forgotPassword":
      return "Não foi possível iniciar a recuperação da password.";

    case "resetPassword":
      return "Não foi possível alterar a password.";

    case "confirmEmail":
      return "Não foi possível confirmar o email.";

    case "resendConfirmationEmail":
      return "Não foi possível reenviar o email de confirmação.";

    default:
      return "Os dados enviados não são válidos.";
  }
}

// ======================================================
// SAFE DEBUG INFO
// ======================================================

function getSafeErrorDetails(
  error: unknown
) {
  if (
    !axios.isAxiosError(error)
  ) {
    return {
      message:
        "Unknown error",
    };
  }

  /*
   * Nunca devolvemos:
   * - Authorization
   * - access token
   * - refresh token
   * - password
   */

  return {
    message:
      error.message,

    code:
      error.code,

    status:
      error.response?.status,

    baseURL:
      error.config?.baseURL,

    url:
      error.config?.url,

    method:
      error.config?.method,
  };
}