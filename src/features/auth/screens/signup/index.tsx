import { useState } from "react";
import {
  ActivityIndicator,
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
  FontAwesome,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";

import { useRegister } from "../../hooks/useRegister";

export default function SignUpScreen() {
  const router = useRouter();

  const { t } =
    useTranslation("auth");

  const {
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
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() =>
          router.back()
        }
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t(
          "signUp.backAccessibility"
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
        {t("signUp.title")}
      </Text>

      <TextInput
        style={styles.input}
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
        autoComplete="username-new"
      />

      <TextInput
        style={styles.input}
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
          autoComplete="new-password"
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
      </View>

      <View
        style={
          styles.inputWrapper
        }
      >
        <TextInput
          style={styles.input}
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
          autoComplete="new-password"
        />

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
      </View>

      <View
        style={
          styles.termsContainer
        }
      >
        <Switch
          value={acceptTerms}
          onValueChange={
            setAcceptTerms
          }
          thumbColor={
            acceptTerms
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

      <TouchableOpacity
        style={[
          styles.signUpButton,
          loading &&
            styles.disabledButton,
        ]}
        onPress={handleSignUp}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t(
          "signUp.createAccessibility"
        )}
      >
        {loading ? (
          <ActivityIndicator
            color="#FFFFFF"
          />
        ) : (
          <Text
            style={
              styles.signUpText
            }
          >
            {t(
              "signUp.button"
            )}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
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

      <Text style={styles.orText}>
        {t(
          "signUp.orSignUpWith"
        )}
      </Text>

      <View
        style={
          styles.socialContainer
        }
      >
        <TouchableOpacity
          style={
            styles.socialButton
          }
          accessibilityRole="button"
          accessibilityLabel={t(
            "signUp.googleAccessibility"
          )}
        >
          <AntDesign
            name="google"
            size={20}
            color={
              COLORS.onBackground
            }
          />

          <Text
            style={
              styles.socialText
            }
          >
            Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.socialButton
          }
          accessibilityRole="button"
          accessibilityLabel={t(
            "signUp.appleAccessibility"
          )}
        >
          <FontAwesome
            name="apple"
            size={20}
            color={
              COLORS.onBackground
            }
          />

          <Text
            style={
              styles.socialText
            }
          >
            Apple
          </Text>
        </TouchableOpacity>
      </View>
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

  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },

  termsText: {
    color: COLORS.onBackground,
    flex: 1,
    flexWrap: "wrap",
  },

  link: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  signUpButton: {
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

  signUpText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  alreadyText: {
    textAlign: "center",
    color: COLORS.onBackground,
    marginBottom: 20,
  },

  loginLink: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  orText: {
    textAlign: "center",
    color: COLORS.onBackground,
    marginBottom: 10,
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  socialText: {
    marginLeft: 10,
    color: COLORS.onBackground,
    fontWeight: "700",
  },
});