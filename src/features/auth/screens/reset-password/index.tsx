import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
import { ROUTES } from "@/src/constants/routes";

import { useResetPassword } from "../../hooks/useResetPassword";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <TouchableOpacity
        onPress={() =>
          router.replace(
            ROUTES.SIGN_IN
          )
        }
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t(
          "resetPassword.backAccessibility"
        )}
      >
        <AntDesign
          name="arrow-left"
          size={24}
          color={COLORS.onBackground}
        />
      </TouchableOpacity>

      <Text style={styles.title}>
        {t("resetPassword.title")}
      </Text>

      <Text style={styles.subtitle}>
        {t("resetPassword.subtitle")}
      </Text>

      <View
        style={styles.inputWrapper}
      >
        <TextInput
          style={styles.input}
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
          )}
        />

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
      </View>

      <View
        style={styles.inputWrapper}
      >
        <TextInput
          style={styles.input}
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
          )}
        />

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
      </View>

      <TouchableOpacity
        style={[
          styles.resetButton,
          loading &&
            styles.disabledButton,
        ]}
        onPress={handleReset}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t(
          "resetPassword.submitAccessibility"
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
              "resetPassword.button"
            )}
          </Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
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

  inputWrapper: {
    position: "relative",
    marginBottom: 15,
  },

  input: {
    backgroundColor:
      COLORS.surface,
    padding: 15,
    paddingRight: 48,
    borderRadius: 8,
    color: COLORS.onBackground,
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 11,
    padding: 4,
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
});