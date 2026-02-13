import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";
import { useForgotPassword } from "../../hooks/useForgotPassword";
import { ROUTES } from "@/src/constants/routes";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email, setEmail, loading, handleSubmit } = useForgotPassword();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.replace(ROUTES.SIGN_IN)}
        style={styles.backButton}
        accessibilityLabel="Go back to login"
      >
        <AntDesign name="arrow-left" size={24} color={COLORS.onBackground} />
      </TouchableOpacity>

      {/* Title & Subtitle */}
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.subtitle}>
        Enter your email and we’ll send you a link to reset it.
      </Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={COLORS.onBackground}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email input"
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.resetButton, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Send password reset link"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.resetButtonText}>Send reset link</Text>
        )}
      </TouchableOpacity>

      {/* Navigation to Login */}
      <TouchableOpacity onPress={() => router.replace(ROUTES.SIGN_IN)}>
        <Text style={styles.backToLoginText}>
          Remembered your password?{" "}
          <Text style={styles.backToLoginLink}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
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
  input: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    color: COLORS.onBackground,
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
  backToLoginText: {
    textAlign: "center",
    color: COLORS.onBackground,
    marginTop: 20,
  },
  backToLoginLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});
