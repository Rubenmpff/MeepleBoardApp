import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import {
  useEffect,
  useState,
} from "react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import { authService } from "../services/authService";

function getSingleParam(
  value:
    | string
    | string[]
    | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isValidPassword(
  password: string
) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
    password
  );
}

export const useResetPassword = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const params =
    useLocalSearchParams<{
      token?: string | string[];
      email?: string | string[];
    }>();

  const token = getSingleParam(
    params.token
  );

  const email = getSingleParam(
    params.email
  );

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const navigationGuard = useUnsavedChanges(!!newPassword || !!confirmPassword, loading, "/forgot-password");

  useEffect(() => {
    if (token && email) {
      return;
    }

    Toast.show({
      type: "error",
      text1: t(
        "resetPasswordValidation.invalidLinkTitle"
      ),
      text2: t(
        "resetPasswordValidation.invalidLinkDescription"
      ),
    });

    router.replace(
      "/forgot-password"
    );
  }, [email, router, t, token]);

  async function handleReset() {
    const trimmedPassword =
      newPassword.trim();

    const trimmedConfirmation =
      confirmPassword.trim();

    if (
      !trimmedPassword ||
      !trimmedConfirmation
    ) {
      Toast.show({
        type: "error",
        text1: t(
          "resetPasswordValidation.missingFieldsTitle"
        ),
        text2: t(
          "resetPasswordValidation.missingFieldsDescription"
        ),
      });

      return;
    }

    if (
      trimmedPassword !==
      trimmedConfirmation
    ) {
      Toast.show({
        type: "error",
        text1: t(
          "resetPasswordValidation.passwordMismatchTitle"
        ),
        text2: t(
          "resetPasswordValidation.passwordMismatchDescription"
        ),
      });

      return;
    }

    if (
      !isValidPassword(
        trimmedPassword
      )
    ) {
      Toast.show({
        type: "error",
        text1: t(
          "resetPasswordValidation.weakPasswordTitle"
        ),
        text2: t(
          "resetPasswordValidation.weakPasswordDescription"
        ),
      });

      return;
    }

    setLoading(true);

    try {
      const result =
        await authService.resetPassword(
          {
            email: email
              .trim()
              .toLowerCase(),
            token: decodeURIComponent(
              token
            )
              .trim()
              .replace(/\s/g, "+"),
            password:
              trimmedPassword,
            confirmPassword:
              trimmedConfirmation,
          }
        );

      if (result.success) {
        Toast.show({
          type: "success",
          text1: t(
            "resetPasswordValidation.successTitle"
          ),
          text2: t(
            "resetPasswordValidation.successDescription"
          ),
        });

        navigationGuard.allowExit();
        router.replace("/signin");

        return;
      }

      const normalizedMessage =
        result.message?.toLowerCase() ??
        "";

      const linkExpired =
        normalizedMessage.includes(
          "reset link is no longer valid"
        ) ||
        normalizedMessage.includes(
          "expired"
        ) ||
        normalizedMessage.includes(
          "invalid token"
        );

      if (linkExpired) {
        Toast.show({
          type: "error",
          text1: t(
            "resetPasswordValidation.expiredTitle"
          ),
          text2: t(
            "resetPasswordValidation.expiredDescription"
          ),
        });

        router.replace(
          "/forgot-password"
        );

        return;
      }

      Toast.show({
        type: "error",
        text1: t(
          "resetPasswordValidation.failedTitle"
        ),
        text2:
          result.message ||
          t(
            "resetPasswordValidation.failedDescription"
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao alterar a palavra-passe:",
        error
      );

      Toast.show({
        type: "error",
        text1: t(
          "resetPasswordValidation.unexpectedTitle"
        ),
        text2: t(
          "resetPasswordValidation.unexpectedDescription"
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    cancel: navigationGuard.cancel,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    loading,
    handleReset,
  };
};