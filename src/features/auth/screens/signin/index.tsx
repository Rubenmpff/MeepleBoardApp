import { useEffect, useState } from "react";
import { BackHandler, Switch, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import AuthLayout from "../../components/AuthLayout";
import AuthField from "../../components/AuthField";
import AuthMessage from "../../components/AuthMessage";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { AUTH_STYLES as styles } from "../../styles/authStyles";
import { useSignIn } from "../../hooks/useSignIn";

export default function SignInScreen() {
  const router = useRouter();

  const { t } =
    useTranslation("auth");

  const {
    cancel,
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
      cancel();

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
  }, [cancel]);

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
      <PrimaryButton variant="secondary" title={message} onPress={handleResendConfirmation} loading={resendLoading} disabled={resendLoading || resendCooldown > 0} accessibilityLabel={t("signIn.resend.accessibility")} />
    );
  }

  return (
    <AuthLayout title={t("signIn.title")} onBack={cancel} backAccessibilityLabel={t(
        "signIn.backAccessibility"
      )}>

      <AuthField label={t(
        "signIn.email"
      )}
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
        autoComplete="email" />

      <AuthField label={t(
        "signIn.password"
      )}
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
        autoComplete="password">
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
      </AuthField>

      <TouchableOpacity
        style={UI_STYLES.control} onPress={() =>
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

        <Switch hitSlop={8}
          accessibilityLabel={t("signIn.rememberMe")} value={rememberMe}
          onValueChange={
            setRememberMe
          }
          thumbColor={COLORS.onPrimary}
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
          <AuthMessage>{errorMessage}</AuthMessage>
        )}

      {showResend &&
        renderResendBlock()}

      <PrimaryButton title={t("signIn.button")} onPress={handleLogin} loading={loading} accessibilityLabel={t(
        "signIn.button"
      )} />
    </AuthLayout>
  );
}
