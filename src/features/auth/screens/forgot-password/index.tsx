import { Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import AuthLayout from "../../components/AuthLayout";
import AuthField from "../../components/AuthField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { AUTH_STYLES as styles } from "../../styles/authStyles";
import { ROUTES } from "@/src/constants/routes";
import { useForgotPassword } from "../../hooks/useForgotPassword";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const {
    email,
    setEmail,
    loading,
    handleSubmit,
  } = useForgotPassword();

  return (
    <AuthLayout title={t("forgotPassword.title")} onBack={() =>
      router.replace(ROUTES.SIGN_IN)} backAccessibilityLabel={t(
        "forgotPassword.backAccessibility"
      )}>

      <Text style={styles.subtitle}>
        {t("forgotPassword.subtitle")}
      </Text>

      <AuthField label={t(
        "forgotPassword.email"
      )}
        placeholder={t(
          "forgotPassword.email"
        )}
        placeholderTextColor={
          COLORS.textMuted
        }
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel={t(
          "forgotPassword.emailAccessibility"
        )} />

      <PrimaryButton title={t("forgotPassword.button")} onPress={handleSubmit} loading={loading} accessibilityLabel={t(
        "forgotPassword.buttonAccessibility"
      )} />

      <TouchableOpacity
        style={UI_STYLES.control} onPress={() =>
          router.replace(
            ROUTES.SIGN_IN
          )
        }
        accessibilityRole="button"
      >
        <Text
          style={
            styles.backToLoginText
          }
        >
          {t(
            "forgotPassword.rememberedPassword"
          )}

          <Text
            style={
              styles.backToLoginLink
            }
          >
            {t(
              "forgotPassword.login"
            )}
          </Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}
