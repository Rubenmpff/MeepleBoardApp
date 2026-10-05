import {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";
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
        "confirmEmail.tryAgainButton"
      );

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/MeepleBoardLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        {t("confirmEmail.title")}
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <>
          <AntDesign
            name={iconName}
            size={60}
            color={iconColor}
            style={styles.icon}
          />

          <Text
            style={[
              styles.message,
              success
                ? styles.successText
                : styles.errorText,
            ]}
          >
            {message}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.replace(
                success
                  ? ROUTES.SIGN_IN
                  : "/welcome"
              )
            }
            accessibilityRole="button"
            accessibilityLabel={t(
              "confirmEmail.buttonAccessibility"
            )}
          >
            <Text
              style={
                styles.buttonText
              }
            >
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor:
      COLORS.background,
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.onBackground,
    textAlign: "center",
    marginBottom: 20,
  },

  icon: {
    marginBottom: 15,
  },

  message: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 15,
  },

  successText: {
    color: COLORS.success,
    fontWeight: "700",
  },

  errorText: {
    color: COLORS.error,
    fontWeight: "700",
  },

  button: {
    backgroundColor:
      COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});