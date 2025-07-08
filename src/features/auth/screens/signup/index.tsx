import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { AntDesign, FontAwesome, Feather } from "@expo/vector-icons";
import { useState } from "react";
import { useRegister } from "../../hooks/useRegister";
import { COLORS } from "@/src/constants/colors";

export default function SignUpScreen() {
  const router = useRouter();
  const {
    username, setUsername,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    acceptTerms, setAcceptTerms,
    loading,
    handleSignUp
  } = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <View style={styles.container}>
      {/* 🔙 Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <AntDesign name="arrowleft" size={24} color={COLORS.onBackground} />
      </TouchableOpacity>

      <Text style={styles.title}>Create your account</Text>

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={COLORS.onBackground}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.onBackground}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.onBackground}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Feather
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={COLORS.onBackground}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={COLORS.onBackground}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
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

      {/* Terms */}
      <View style={styles.termsContainer}>
        <Switch
          value={acceptTerms}
          onValueChange={setAcceptTerms}
          thumbColor={acceptTerms ? COLORS.primary : COLORS.surface}
          trackColor={{ false: COLORS.surface, true: COLORS.primary }}
        />
        <Text style={styles.termsText}>
          I accept the{" "}
          <Text style={styles.link}>Terms of Service</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>

      {/* Sign up button */}
      <TouchableOpacity
        style={styles.signUpButton}
        onPress={handleSignUp}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Create account"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signUpText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      {/* Navigation link */}
      <TouchableOpacity onPress={() => router.push("/signin")}>
        <Text style={styles.alreadyText}>
          Already have an account?{" "}
          <Text style={styles.loginLink}>Log in</Text>
        </Text>
      </TouchableOpacity>

      <Text style={styles.orText}>Or sign up with</Text>

      {/* Social login buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity
          style={styles.socialButton}
          accessibilityRole="button"
          accessibilityLabel="Sign up with Google"
        >
          <AntDesign name="google" size={20} color={COLORS.onBackground} />
          <Text style={styles.socialText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialButton}
          accessibilityRole="button"
          accessibilityLabel="Sign up with Apple"
        >
          <FontAwesome name="apple" size={20} color={COLORS.onBackground} />
          <Text style={styles.socialText}>Apple</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 20,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: 15,
    paddingRight: 40,
    borderRadius: 8,
    color: COLORS.onBackground,
    marginBottom: 10,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 15,
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
    fontWeight: "bold",
  },
  signUpButton: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  signUpText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  alreadyText: {
    textAlign: "center",
    color: COLORS.onBackground,
    marginBottom: 20,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "bold",
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
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  socialText: {
    marginLeft: 10,
    color: COLORS.onBackground,
    fontWeight: "bold",
  },
});
