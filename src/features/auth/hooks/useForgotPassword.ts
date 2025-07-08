// src/features/auth/hooks/useForgotPassword.ts

import { useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { authService } from "../services/authService";

export const useForgotPassword = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /** Basic email format validation */
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  /** Submit handler for requesting a password reset email */
  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Toast.show({
        type: "error",
        text1: "Missing email",
        text2: "Please enter your email address.",
      });
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Toast.show({
        type: "error",
        text1: "Invalid email",
        text2: "Please enter a valid email address.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await authService.forgotPassword(trimmedEmail);

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Reset link sent 📩",
          text2: "Check your inbox to reset your password.",
        });

        router.replace("/signin");
      } else {
        const msg = res.message?.toLowerCase();

        if (msg?.includes("confirm")) {
          Toast.show({
            type: "error",
            text1: "Email not confirmed",
            text2: "Please confirm your email before resetting your password.",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Reset failed",
            text2: res.message || "Something went wrong. Please try again.",
          });
        }
      }
    } catch (err) {
      console.error("❌ Forgot password error:", err);
      Toast.show({
        type: "error",
        text1: "Unexpected error",
        text2: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    handleSubmit,
  };
};
