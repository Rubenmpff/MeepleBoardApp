import { useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AUTH_COLORS as AUTH } from "../../styles/authTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import AuthLayout from "../../components/AuthLayout";
import AuthField from "../../components/AuthField";
import AuthButton from "../../components/AuthButton";
import { AUTH_STYLES as styles } from "../../styles/authStyles";
import { useRegister } from "../../hooks/useRegister";

const COLORS = { ...AUTH, textMuted: AUTH.muted, onBackground: AUTH.text, border: AUTH.border, onPrimary: AUTH.onPrimary, success: AUTH.primary };

export default function SignUpScreen() {
  const router = useRouter();

  const { t } =
    useTranslation("auth");

  const {
    cancel,
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
  } = useRegister();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  return (
    <AuthLayout title={t("visual.signUpTitle")} subtitle={t("visual.signUpSubtitle")} onBack={cancel} backAccessibilityLabel={t(
        "signUp.backAccessibility"
      )}>

      <AuthField label={t(
        "signUp.username"
      )}
        placeholder={t(
          "signUp.username"
        )}
        placeholderTextColor={
          COLORS.textMuted
        }
        value={username}
        onChangeText={
          setUsername
        }
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        autoComplete="username-new" />

      <AuthField label={t(
        "signUp.email"
      )}
        placeholder={t(
          "signUp.email"
        )}
        placeholderTextColor={
          COLORS.textMuted
        }
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        textContentType="emailAddress"
        autoComplete="email" />

      <AuthField label={t(
        "signUp.password"
      )}
        placeholder={t(
          "signUp.password"
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
        textContentType="newPassword"
        autoComplete="new-password">
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
              ? "signUp.hidePassword"
              : "signUp.showPassword"
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

      <Text style={styles.helper}>{t("registerValidation.weakPasswordDescription")}</Text>

      <AuthField label={t(
        "signUp.confirmPassword"
      )}
        placeholder={t(
          "signUp.confirmPassword"
        )}
        placeholderTextColor={
          COLORS.textMuted
        }
        secureTextEntry={
          !showConfirmPassword
        }
        value={
          confirmPassword
        }
        onChangeText={
          setConfirmPassword
        }
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="new-password">
        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(
              (current) =>
                !current
            )
          }
          style={styles.eyeIcon}
          accessibilityRole="button"
          accessibilityLabel={t(
            showConfirmPassword
              ? "signUp.hideConfirmPassword"
              : "signUp.showConfirmPassword"
          )}
        >
          <Feather
            name={
              showConfirmPassword
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

      <View
        style={
          styles.termsContainer
        }
      >
        <Switch hitSlop={8}
          accessibilityLabel={t("signUp.acceptAccessibility")} value={acceptTerms}
          onValueChange={
            setAcceptTerms
          }
          thumbColor={COLORS.onPrimary}
          trackColor={{
            false:
              COLORS.border,
            true:
              COLORS.primary,
          }}
        />

        <Text
          style={styles.termsText}
        >
          <Text>
            {t(
              "signUp.acceptPrefix"
            )}
          </Text>

          <Text style={styles.link}>
            {t(
              "signUp.terms"
            )}
          </Text>

          <Text>
            {t("signUp.and")}
          </Text>

          <Text style={styles.link}>
            {t(
              "signUp.privacy"
            )}
          </Text>

          <Text>
            {t("signUp.end")}
          </Text>
        </Text>
      </View>

      <AuthButton title={t("signUp.button")} onPress={handleSignUp} loading={loading} accessibilityLabel={t(
        "signUp.createAccessibility"
      )} />

      <TouchableOpacity
        style={UI_STYLES.control} onPress={() =>
          router.push("/signin")
        }
        accessibilityRole="button"
      >
        <Text
          style={
            styles.alreadyText
          }
        >
          {t(
            "signUp.alreadyHaveAccount"
          )}

          <Text
            style={
              styles.loginLink
            }
          >
            {t(
              "signUp.login"
            )}
          </Text>
        </Text>
      </TouchableOpacity>

    </AuthLayout>
  );
}
