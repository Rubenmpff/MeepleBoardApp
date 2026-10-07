import { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AUTH_COLORS as AUTH } from "../../styles/authTheme";
import AuthLayout from "../../components/AuthLayout";
import AuthMessage from "../../components/AuthMessage";
import AuthButton from "../../components/AuthButton";
import ScreenState from "@/src/components/ui/ScreenState";
import { AUTH_STYLES as styles } from "../../styles/authStyles";
import { ROUTES } from "@/src/constants/routes";
import { authService } from "../../services/authService";

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

const COLORS = { ...AUTH, textMuted: AUTH.muted, onBackground: AUTH.text, border: AUTH.border, onPrimary: AUTH.onPrimary, success: AUTH.primary };

export default function ConfirmEmailScreen() {
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

  const [loading, setLoading] =
    useState(true);

  const [success, setSuccess] =
    useState<boolean | null>(null);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function confirmEmail() {
      if (!token || !email) {
        if (isMounted) {
          setMessage(
            t(
              "confirmEmail.invalidLink"
            )
          );

          setSuccess(false);
          setLoading(false);
        }

        return;
      }

      try {
        const cleanedToken =
          decodeURIComponent(token)
            .trim()
            .replace(/\s/g, "+");

        const response =
          await authService.confirmEmail(
            cleanedToken,
            email.trim().toLowerCase()
          );

        if (!isMounted) {
          return;
        }

        if (response.success) {
          setMessage(
            t("confirmEmail.success")
          );

          setSuccess(true);

          return;
        }

        setMessage(
          response.message ||
          t("confirmEmail.failed")
        );

        setSuccess(false);
      } catch (error) {
        console.error(
          "Erro ao confirmar o email:",
          error
        );

        if (isMounted) {
          setMessage(
            t(
              "confirmEmail.unexpectedError"
            )
          );

          setSuccess(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void confirmEmail();

    return () => {
      isMounted = false;
    };
  }, [email, t, token]);

  const iconName:
    | "check-circle"
    | "close-circle" =
    success
      ? "check-circle"
      : "close-circle";

  const iconColor = success
    ? COLORS.success
    : COLORS.error;

  const buttonLabel = success
    ? t("confirmEmail.loginButton")
    : t(
      "confirmEmail.welcomeButton"
    );

  return (
    <AuthLayout title={t("confirmEmail.title")}>

      {loading ? (
        <ScreenState loading message={t("ui.loading")} />
      ) : (
        <>
          <AntDesign
            name={iconName}
            size={60}
            color={iconColor}
            style={styles.icon}
          />

          <AuthMessage variant={success ? "success" : "error"}>{message}</AuthMessage>

          <AuthButton title={buttonLabel} onPress={() =>
            router.replace(
              success
                ? ROUTES.SIGN_IN
                : "/welcome"
            )} accessibilityLabel={buttonLabel} />
        </>
      )}
    </AuthLayout>
  );
}
