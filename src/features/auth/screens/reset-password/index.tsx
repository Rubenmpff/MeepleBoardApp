import { useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AUTH_COLORS as AUTH } from "../../styles/authTheme";
import AuthLayout from "../../components/AuthLayout";
import AuthField from "../../components/AuthField";
import AuthButton from "../../components/AuthButton";
import { AUTH_STYLES as styles } from "../../styles/authStyles";
import { ROUTES } from "@/src/constants/routes";
import { useResetPassword } from "../../hooks/useResetPassword";

const COLORS = { ...AUTH, textMuted: AUTH.muted, onBackground: AUTH.text, border: AUTH.border, onPrimary: AUTH.onPrimary, success: AUTH.primary };

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const {
    cancel,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    loading,
    handleReset,
  } = useResetPassword();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  return (
    <AuthLayout title={t("resetPassword.title")} onBack={cancel} backAccessibilityLabel={t(
        "resetPassword.backAccessibility"
      )}>

      <Text style={styles.subtitle}>
        {t("resetPassword.subtitle")}
      </Text>

      <AuthField label={t(
        "resetPassword.newPassword"
      )}
        placeholder={t(
          "resetPassword.newPassword"
        )}
        placeholderTextColor={
          COLORS.textMuted
        }
        secureTextEntry={
          !showPassword
        }
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        value={newPassword}
        onChangeText={setNewPassword}
        accessibilityLabel={t(
          "resetPassword.newPasswordAccessibility"
        )}>
        <TouchableOpacity
          onPress={() =>
            setShowPassword(
              (current) => !current
            )
          }
          style={styles.eyeIcon}
          accessibilityRole="button"
          accessibilityLabel={t(
            showPassword
              ? "resetPassword.hidePassword"
              : "resetPassword.showPassword"
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

      <AuthField label={t(
        "resetPassword.confirmPassword"
      )}
        placeholder={t(
          "resetPassword.confirmPassword"
        )}
        placeholderTextColor={
          COLORS.textMuted
        }
        secureTextEntry={
          !showConfirmPassword
        }
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChangeText={
          setConfirmPassword
        }
        accessibilityLabel={t(
          "resetPassword.confirmPasswordAccessibility"
        )}>
        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(
              (current) => !current
            )
          }
          style={styles.eyeIcon}
          accessibilityRole="button"
          accessibilityLabel={t(
            showConfirmPassword
              ? "resetPassword.hideConfirmPassword"
              : "resetPassword.showConfirmPassword"
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

      <AuthButton title={t("resetPassword.button")} onPress={handleReset} loading={loading} accessibilityLabel={t(
        "resetPassword.submitAccessibility"
      )} />
    </AuthLayout>
  );
}
