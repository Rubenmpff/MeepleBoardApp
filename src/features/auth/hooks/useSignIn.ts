// src/features/auth/hooks/useSignIn.ts

import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import { authService } from "../services/authService";

const MAX_RESENDS_PER_DAY = 3;
const RESEND_COOLDOWN_SECONDS = 60;

export const useSignIn = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showResend, setShowResend] = useState(false);
  const [hasPromptedResend, setHasPromptedResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);

  const cooldownIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    );
  }

  function resetStates() {
    setErrorMessage("");
    setShowResend(false);
  }

  function handleLoginError(
    message?: string,
    errors?: string[]
  ) {
    const backendMessage =
      errors?.[0] ||
      message ||
      "";

    const normalizedMessage =
      backendMessage.toLowerCase();

    const isConfirmationError =
      normalizedMessage.includes("confirm") ||
      normalizedMessage.includes("confirmed") ||
      normalizedMessage.includes("confirmation") ||
      normalizedMessage.includes("verificar") ||
      normalizedMessage.includes("confirmar");

    const isCredentialsError =
      normalizedMessage.includes("email") ||
      normalizedMessage.includes("password") ||
      normalizedMessage.includes("credential") ||
      normalizedMessage.includes("palavra-passe");

    if (isConfirmationError) {
      if (!hasPromptedResend) {
        setShowResend(true);
        setHasPromptedResend(true);
      }

      setErrorMessage(
        t("signInValidation.emailNotConfirmed")
      );

      return;
    }

    if (isCredentialsError) {
      setErrorMessage(
        t("signInValidation.invalidCredentials")
      );

      return;
    }

    setErrorMessage(
      backendMessage ||
        t("signInValidation.loginFailed")
    );
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        t("signInValidation.required")
      );

      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage(
        t("signInValidation.invalidEmail")
      );

      return;
    }

    setLoading(true);
    resetStates();

    try {
      const result =
        await authService.login(
          {
            email: email.trim().toLowerCase(),
            password,
          },
          rememberMe
        );

      if (!result.success) {
        handleLoginError(
          result.message,
          result.errors
        );

        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error(
        "Erro inesperado no login:",
        error
      );

      setErrorMessage(
        t("signInValidation.unexpectedError")
      );
    } finally {
      setLoading(false);
    }
  }

  function startResendCooldown() {
    if (cooldownIntervalRef.current) {
      clearInterval(
        cooldownIntervalRef.current
      );
    }

    setResendCooldown(
      RESEND_COOLDOWN_SECONDS
    );

    cooldownIntervalRef.current =
      setInterval(() => {
        setResendCooldown(
          (previousValue) => {
            if (previousValue <= 1) {
              if (
                cooldownIntervalRef.current
              ) {
                clearInterval(
                  cooldownIntervalRef.current
                );

                cooldownIntervalRef.current =
                  null;
              }

              return 0;
            }

            return previousValue - 1;
          }
        );
      }, 1000);
  }

  async function handleResendConfirmation() {
    if (resendCooldown > 0) {
      Toast.show({
        type: "info",
        text1: t(
          "resendConfirmation.waitTitle"
        ),
        text2: t(
          "resendConfirmation.remaining",
          {
            seconds: resendCooldown,
          }
        ),
      });

      return;
    }

    if (
      resendAttempts >=
      MAX_RESENDS_PER_DAY
    ) {
      Toast.show({
        type: "error",
        text1: t(
          "resendConfirmation.limitTitle"
        ),
        text2: t(
          "resendConfirmation.limitDescription"
        ),
      });

      return;
    }

    setResendLoading(true);

    try {
      const result =
        await authService.resendConfirmationEmail(
          email.trim().toLowerCase()
        );

      if (result.success) {
        Toast.show({
          type: "success",
          text1: t(
            "resendConfirmation.successTitle"
          ),
          text2: t(
            "resendConfirmation.successDescription"
          ),
        });

        setResendAttempts(
          (previousValue) =>
            previousValue + 1
        );

        startResendCooldown();

        return;
      }

      Toast.show({
        type: "error",
        text1: t(
          "resendConfirmation.failedTitle"
        ),
        text2:
          result.message ||
          t(
            "resendConfirmation.failedDescription"
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao reenviar o email de confirmação:",
        error
      );

      Toast.show({
        type: "error",
        text1: t(
          "resendConfirmation.unexpectedTitle"
        ),
        text2: t(
          "resendConfirmation.unexpectedDescription"
        ),
      });
    } finally {
      setResendLoading(false);
    }
  }

  return {
    email,
    setEmail,

    password,
    setPassword,

    rememberMe,
    setRememberMe,

    loading,
    errorMessage,

    handleLogin,

    showResend,
    handleResendConfirmation,

    resendLoading,
    resendCooldown,
  };
};