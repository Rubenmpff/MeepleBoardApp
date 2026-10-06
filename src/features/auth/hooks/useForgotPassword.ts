import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import { authService } from "../services/authService";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );
}

export const useForgotPassword = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const navigationGuard = useUnsavedChanges(!!email, loading, "/signin");

  async function handleSubmit() {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      Toast.show({
        type: "error",
        text1: t(
          "forgotPasswordValidation.missingEmailTitle"
        ),
        text2: t(
          "forgotPasswordValidation.missingEmailDescription"
        ),
      });

      return;
    }

    if (
      !isValidEmail(normalizedEmail)
    ) {
      Toast.show({
        type: "error",
        text1: t(
          "forgotPasswordValidation.invalidEmailTitle"
        ),
        text2: t(
          "forgotPasswordValidation.invalidEmailDescription"
        ),
      });

      return;
    }

    setLoading(true);

    try {
      const response =
        await authService.forgotPassword(
          normalizedEmail
        );

      if (response.success) {
        Toast.show({
          type: "success",
          text1: t(
            "forgotPasswordValidation.successTitle"
          ),
          text2: t(
            "forgotPasswordValidation.successDescription"
          ),
        });

        navigationGuard.allowExit();
        router.replace("/signin");

        return;
      }

      const normalizedMessage =
        response.message?.toLowerCase() ??
        "";

      if (
        normalizedMessage.includes(
          "confirm"
        )
      ) {
        Toast.show({
          type: "error",
          text1: t(
            "forgotPasswordValidation.emailNotConfirmedTitle"
          ),
          text2: t(
            "forgotPasswordValidation.emailNotConfirmedDescription"
          ),
        });

        return;
      }

      Toast.show({
        type: "error",
        text1: t(
          "forgotPasswordValidation.failedTitle"
        ),
        text2:
          response.message ||
          t(
            "forgotPasswordValidation.failedDescription"
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao solicitar recuperação da palavra-passe:",
        error
      );

      Toast.show({
        type: "error",
        text1: t(
          "forgotPasswordValidation.unexpectedTitle"
        ),
        text2: t(
          "forgotPasswordValidation.unexpectedDescription"
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    cancel: navigationGuard.cancel,
    email,
    setEmail,
    loading,
    handleSubmit,
  };
};