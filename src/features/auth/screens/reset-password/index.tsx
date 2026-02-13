import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useState } from "react";
import { useResetPassword } from "../../hooks/useResetPassword";
import { COLORS } from "@/src/constants/colors";


export default function ResetPasswordScreen() {
  const router = useRouter();
  const {
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    loading,
    handleReset,
  } = useResetPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 🔙 Back */}
      <TouchableOpacity
        onPress={() => router.replace("/signin")}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Back to Sign In"
      >
        <AntDesign name="arrow-left" size={24} color={COLORS.onBackground} />
      </TouchableOpacity>

      {/* 🧠 Title */}
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.subtitle}>Enter a new secure password below.</Text>

      {/* 🔐 New Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={COLORS.onBackground}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          value={newPassword}
          onChangeText={setNewPassword}
          accessibilityLabel="New password input"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
          accessibilityLabel="Toggle password visibility"
        >
          <Feather
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={COLORS.onBackground}
          />
        </TouchableOpacity>
      </View>

      {/* 🔐 Confirm Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={COLORS.onBackground}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeIcon}
        >
          <Feather
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={20}
            color={COLORS.onBackground}
          />
        </TouchableOpacity>
      </View>

      {/* ✅ Submit */}
      <TouchableOpacity
        style={[styles.resetButton, loading && { opacity: 0.6 }]}
        onPress={handleReset}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Submit new password"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.resetButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.onBackground,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.onBackground,
    marginBottom: 30,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: 15,
    paddingRight: 40,
    borderRadius: 8,
    color: COLORS.onBackground,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 15,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
