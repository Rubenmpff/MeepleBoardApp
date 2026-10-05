import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";
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
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() =>
          router.replace(ROUTES.SIGN_IN)
        }
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t(
          "forgotPassword.backAccessibility"
        )}
      >
        <AntDesign
          name="arrow-left"
          size={24}
          color={COLORS.onBackground}
        />
      </TouchableOpacity>

      <Text style={styles.title}>
        {t("forgotPassword.title")}
      </Text>

      <Text style={styles.subtitle}>
        {t("forgotPassword.subtitle")}
      </Text>

      <TextInput
        style={styles.input}
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
        )}
      />

      <TouchableOpacity
        style={[
          styles.resetButton,
          loading &&
            styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t(
          "forgotPassword.buttonAccessibility"
        )}
      >
        {loading ? (
          <ActivityIndicator
            color="#FFFFFF"
          />
        ) : (
          <Text
            style={
              styles.resetButtonText
            }
          >
            {t(
              "forgotPassword.button"
            )}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
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
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    color: COLORS.onBackground,
    marginBottom: 30,
  },

  input: {
    backgroundColor:
      COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    color: COLORS.onBackground,
  },

  resetButton: {
    backgroundColor:
      COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  resetButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  backToLoginText: {
    textAlign: "center",
    color: COLORS.onBackground,
    marginTop: 20,
  },

  backToLoginLink: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});