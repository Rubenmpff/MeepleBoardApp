// src/features/auth/hooks/useSignIn.ts

import { useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { authService } from "../services/authService";

// 📌 Confirmation email resend limits
const MAX_RESENDS_PER_DAY = 3;
const RESEND_COOLDOWN_SECONDS = 60;

export const useSignIn = () => {
  const router = useRouter();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // State management
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Confirmation resend logic
  const [showResend, setShowResend] = useState(false);
  const [hasPromptedResend, setHasPromptedResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const resetStates = () => {
    setErrorMessage("");
    setShowResend(false);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    resetStates();

    try {
      console.log("🔐 Attempting login:", { email, rememberMe });
      const result = await authService.login({ email, password }, rememberMe);

      if (!result.success) {
        handleLoginError(result.message, result.errors);
        return;
      }

      console.log("✅ Login successful → redirecting to dashboard");
      router.replace("/dashboard");
    } catch (error) {
      console.error("❌ Unexpected login error:", error);
      setErrorMessage("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (message?: string, errors?: string[]) => {
    const finalMessage = errors?.[0] || message || "Login failed.";
    const lowerMsg = finalMessage.toLowerCase();

    if (lowerMsg.includes("confirm")) {
      if (!hasPromptedResend) {
        setShowResend(true);
        setHasPromptedResend(true);
      }
      setErrorMessage("Please confirm your email before logging in.");
    } else if (lowerMsg.includes("email") || lowerMsg.includes("password")) {
      setErrorMessage("Invalid email or password.");
    } else {
      setErrorMessage(finalMessage);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) {
      Toast.show({
        type: "info",
        text1: "Please wait before resending",
        text2: `${resendCooldown}s remaining.`,
      });
      return;
    }

    if (resendAttempts >= MAX_RESENDS_PER_DAY) {
      Toast.show({
        type: "error",
        text1: "Daily limit reached",
        text2: "Try again tomorrow.",
      });
      return;
    }

    setResendLoading(true);

    try {
      console.log("📤 Resending confirmation email to:", email);
      const result = await authService.resendConfirmationEmail(email);

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Confirmation email sent",
          text2: "Check your inbox 📬",
        });
        setResendAttempts((prev) => prev + 1);
        startResendCooldown();
      } else {
        Toast.show({
          type: "error",
          text1: "Resend failed",
          text2: result.message || "Couldn’t resend confirmation email.",
        });
      }
    } catch (error) {
      console.error("❌ Resend confirmation error:", error);
      Toast.show({
        type: "error",
        text1: "Unexpected error",
        text2: "Please try again later.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading,
    errorMessage,
    handleLogin,
    showResend,
    handleResendConfirmation,
    resendLoading,
    resendCooldown,
  };
};
