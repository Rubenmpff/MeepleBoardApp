// src/features/auth/hooks/useRegister.ts

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

function isStrongPassword(
  password: string
) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(
    password
  );
}

export const useRegister = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    acceptTerms,
    setAcceptTerms,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleSignUp() {
    const normalizedUsername =
      username.trim();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !normalizedUsername ||
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      Toast.show({
        type: "error",
        text1: t(
          "registerValidation.missingFieldsTitle"
        ),
        text2: t(
          "registerValidation.missingFieldsDescription"
        ),
      });

      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Toast.show({
        type: "error",
        text1: t(
          "registerValidation.invalidEmailTitle"
        ),
        text2: t(
          "registerValidation.invalidEmailDescription"
        ),
      });

      return;
    }

    if (!isStrongPassword(password)) {
      Toast.show({
        type: "error",
        text1: t(
          "registerValidation.weakPasswordTitle"
        ),
        text2: t(
          "registerValidation.weakPasswordDescription"
        ),
      });

      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: t(
          "registerValidation.passwordMismatchTitle"
        ),
        text2: t(
          "registerValidation.passwordMismatchDescription"
        ),
      });

      return;
    }

    if (!acceptTerms) {
      Toast.show({
        type: "error",
        text1: t(
          "registerValidation.termsTitle"
        ),
        text2: t(
          "registerValidation.termsDescription"
        ),
      });

      return;
    }

    setLoading(true);

    try {
      const response =
        await authService.register({
          username:
            normalizedUsername,
          email: normalizedEmail,
          password,
          isMobile: true,
        });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: t(
            "registerValidation.successTitle"
          ),
          text2: t(
            "registerValidation.successDescription"
          ),
        });

        router.replace("/signin");

        return;
      }

      Toast.show({
        type: "error",
        text1: t(
          "registerValidation.failedTitle"
        ),
        text2:
          response.message ||
          t(
            "registerValidation.failedDescription"
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao criar a conta:",
        error
      );

      Toast.show({
        type: "error",
        text1: t(
          "registerValidation.unexpectedTitle"
        ),
        text2: t(
          "registerValidation.unexpectedDescription"
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    username,
    setUsername,

    email,
    setEmail,

    password,
    setPassword,

    confirmPassword,
    setConfirmPassword,

    acceptTerms,
    setAcceptTerms,

    loading,
    handleSignUp,
  };
};