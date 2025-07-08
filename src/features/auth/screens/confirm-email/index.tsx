import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { authService } from "../../services/authService";
import { COLORS } from "@/src/constants/colors";
import { Route } from "expo-router/build/Route";
import { ROUTES } from "@/src/constants/routes";

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setMessage("Invalid confirmation link.");
      setSuccess(false);
      setLoading(false);
      return;
    }

    const confirmEmail = async () => {
      try {
        const cleanedToken = decodeURIComponent(token).trim().replace(/\s/g, "+");
        const response = await authService.confirmEmail(cleanedToken, email);

        if (response.success) {
          setMessage("Your email has been confirmed! You can now log in.");
          setSuccess(true);
        } else {
          setMessage(response.message || "Confirmation failed. The link may have expired.");
          setSuccess(false);
        }
      } catch (error) {
        setMessage("Something went wrong during email confirmation.");
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [token, email]);

  const iconName = success ? "checkcircle" : "closecircle";
  const iconColor = success ? COLORS.success : COLORS.error;
  const buttonLabel = success ? "Log in now" : "Try again";

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/MeepleBoardLogo.png')} style={styles.logo} />
      <Text style={styles.title}>Email Confirmation</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <>
          <AntDesign name={iconName} size={60} color={iconColor} style={styles.icon} />
          <Text style={[styles.message, success ? styles.successText : styles.errorText]}>
            {message}
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace(ROUTES.SIGN_IN)}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.background,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.onBackground,
    textAlign: "center",
    marginBottom: 20,
  },
  icon: {
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  successText: {
    color: COLORS.success,
    fontWeight: "bold",
  },
  errorText: {
    color: COLORS.error,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
