import {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AntDesign,
  Feather,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";

import { useSignIn } from "../../hooks/useSignIn";

export default function SignInScreen() {
  const router = useRouter();

  const { t } =
    useTranslation("auth");

  const {
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
  } = useSignIn();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  useEffect(() => {
    function handleBack() {
      router.replace(
        "/welcome"
      );

      return true;
    }

    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        handleBack
      );

    return () => {
      subscription.remove();
    };
  }, [router]);

  function renderResendBlock() {
    let message = t(
      "signIn.resend.action"
    );

    if (resendLoading) {
      message = t(
        "signIn.resend.sending"
      );
    } else if (
      resendCooldown > 0
    ) {
      message = t(
        "signIn.resend.wait",
        {
          seconds:
            resendCooldown,
        }
      );
    }

    return (
      <View
        style={
          styles.resendBlock
        }
      >
        <TouchableOpacity
          onPress={
            handleResendConfirmation
          }
          disabled={
            resendLoading ||
            resendCooldown > 0
          }
          accessibilityRole="button"
          accessibilityLabel={t(
            "signIn.resend.accessibility"
          )}
        >
          <Text
            style={
              styles.resendText
            }
          >
            {message}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() =>
          router.replace(
            "/welcome"
          )
        }
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t(
          "signIn.backAccessibility"
        )}
      >
        <AntDesign
          name="arrow-left"
          size={24}
          color={
            COLORS.onBackground
          }
        />
      </TouchableOpacity>

      <Text style={styles.title}>
        {t("signIn.title")}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t(
          "signIn.email"
        )}
        placeholderTextColor={
          COLORS.textMuted
        }
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="email"
      />

      <View
        style={
          styles.inputWrapper
        }
      >
        <TextInput
          style={styles.input}
          placeholder={t(
            "signIn.password"
          )}
          placeholderTextColor={
            COLORS.textMuted
          }
          secureTextEntry={
            !showPassword
          }
          value={password}
          onChangeText={
            setPassword
          }
          autoCapitalize="none"
          textContentType="password"
          autoComplete="password"
        />

        <TouchableOpacity
          onPress={() =>
            setShowPassword(
              (current) =>
                !current
            )
          }
          style={styles.eyeIcon}
          accessibilityRole="button"
          accessibilityLabel={t(
            showPassword
              ? "signIn.hidePassword"
              : "signIn.showPassword"
          )}
        >
          <Feather
            name={
              showPassword
                ? "eye-off"
                : "eye"
            }
            size={20}
            color={
              COLORS.onBackground
            }
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() =>
          router.push(
            "/forgot-password"
          )
        }
        accessibilityRole="button"
      >
        <Text
          style={
            styles.forgotPassword
          }
        >
          {t(
            "signIn.forgotPassword"
          )}
        </Text>
      </TouchableOpacity>

      <View
        style={
          styles.rememberContainer
        }
      >
        <Text
          style={
            styles.rememberText
          }
        >
          {t(
            "signIn.rememberMe"
          )}
        </Text>

        <Switch
          value={rememberMe}
          onValueChange={
            setRememberMe
          }
          thumbColor={
            rememberMe
              ? COLORS.primary
              : COLORS.surface
          }
          trackColor={{
            false:
              COLORS.border,
            true:
              COLORS.primary,
          }}
        />
      </View>

      {!!errorMessage &&
        typeof errorMessage ===
          "string" && (
          <Text
            style={
              styles.errorText
            }
          >
            {errorMessage}
          </Text>
        )}

      {showResend &&
        renderResendBlock()}

      <TouchableOpacity
        style={[
          styles.loginButton,
          loading &&
            styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t(
          "signIn.button"
        )}
      >
        {loading ? (
          <ActivityIndicator
            color="#FFFFFF"
          />
        ) : (
          <Text
            style={
              styles.loginText
            }
          >
            {t(
              "signIn.button"
            )}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
    padding: 20,
    justifyContent: "center",
  },

  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.onBackground,
    textAlign: "center",
    marginBottom: 20,
  },

  inputWrapper: {
    position: "relative",
    marginBottom: 10,
  },

  input: {
    backgroundColor:
      COLORS.surface,
    padding: 15,
    paddingRight: 48,
    borderRadius: 8,
    color: COLORS.onBackground,
    marginBottom: 10,
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 15,
    padding: 4,
  },

  forgotPassword: {
    color: COLORS.primary,
    textAlign: "right",
    marginBottom: 15,
  },

  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 20,
  },

  rememberText: {
    color: COLORS.onBackground,
  },

  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "700",
  },

  resendBlock: {
    marginBottom: 10,
  },

  resendText: {
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "500",
  },

  loginButton: {
    backgroundColor:
      COLORS.secondary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});