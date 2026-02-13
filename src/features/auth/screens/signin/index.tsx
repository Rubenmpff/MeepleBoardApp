// ✅ SignInScreen.tsx
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";

import { useSignIn } from "../../hooks/useSignIn";
import { COLORS } from "@/src/constants/colors";
import { AntDesign, Feather } from "@expo/vector-icons";


export default function SignInScreen() {
  const router = useRouter();
  const {
    email, setEmail,
    password, setPassword,
    rememberMe, setRememberMe,
    loading,
    errorMessage,
    handleLogin,
    showResend,
    handleResendConfirmation,
    resendLoading,
    resendCooldown,
  } = useSignIn();

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
  const handleBack = () => {
    router.replace("/welcome");
    return true;
  };

  const subscription = BackHandler.addEventListener("hardwareBackPress", handleBack);

  return () => {
    subscription.remove(); // ✅ forma correta nas versões atuais
  };
}, []);


  const renderResendBlock = () => (
    <View style={styles.resendBlock}>
      <TouchableOpacity
        onPress={handleResendConfirmation}
        disabled={resendLoading || resendCooldown > 0}
        accessibilityRole="button"
        accessibilityLabel="Resend Confirmation Email"
      >
        <Text style={styles.resendText}>
          {resendLoading
            ? "⏳ Sending confirmation email..."
            : resendCooldown > 0
            ? `⏳ Wait ${resendCooldown}s before resending`
            : "Didn't get the email? Tap to resend."}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace("/welcome")}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Back to Welcome"
      >
        <AntDesign name="arrow-left" size={24} color={COLORS.onBackground} />
      </TouchableOpacity>

      <Text style={styles.title}>Enter the world of{"\n"}board games!</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.onBackground}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
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

      <TouchableOpacity onPress={() => router.push("/forgot-password")}> 
        <Text style={styles.forgotPassword}>Forgot your password?</Text>
      </TouchableOpacity>

      <View style={styles.rememberContainer}>
        <Text style={styles.rememberText}>Keep me signed in</Text>
        <Switch
          value={rememberMe}
          onValueChange={setRememberMe}
          thumbColor={rememberMe ? COLORS.primary : COLORS.surface}
          trackColor={{ false: COLORS.surface, true: COLORS.primary }}
        />
      </View>

      {!!errorMessage && typeof errorMessage === "string" && (<Text style={styles.errorText}>{errorMessage}</Text>)}
      {showResend && renderResendBlock()}

      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Sign In"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Sign in</Text>
        )}
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
  forgotPassword: {
    color: COLORS.primary,
    textAlign: "right",
    marginBottom: 15,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  rememberText: {
    color: COLORS.onBackground,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  resendBlock: {
    marginBottom: 10,
  },
  resendText: {
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
