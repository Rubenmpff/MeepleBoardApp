// src/features/auth/hooks/useResetPassword.ts

import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { authService } from "../services/authService";

export const useResetPassword = () => {
  const router = useRouter();
  const { token, email } = useLocalSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Valid password: 8+ characters, 1 uppercase, 1 number, 1 symbol
  const isValidPassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

  useEffect(() => {
    if (!token || !email) {
      Toast.show({
        type: "error",
        text1: "Invalid or expired link",
        text2: "Please request a new password reset.",
      });
      router.replace("/forgot-password");
    }
  }, [token, email]);

  const handleReset = async () => {
    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirm) {
      return Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Please fill in all required fields.",
      });
    }

    if (trimmedPassword !== trimmedConfirm) {
      return Toast.show({
        type: "error",
        text1: "Password mismatch",
        text2: "Passwords do not match.",
      });
    }

    if (!isValidPassword(trimmedPassword)) {
      return Toast.show({
        type: "error",
        text1: "Weak password",
        text2:
          "Use at least 8 characters, one uppercase letter, one number, and one symbol.",
      });
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword({
        email: (email as string).trim().toLowerCase(),
        token: (token as string).trim(),
        password: trimmedPassword,
        confirmPassword: trimmedConfirm,
      });

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Password updated",
          text2: "You can now log in.",
        });
        router.replace("/signin");
        return;
      }

      if (
        result.message?.toLowerCase().includes("reset link is no longer valid")
      ) {
        Toast.show({
          type: "error",
          text1: "Reset link expired",
          text2: "Please request a new password reset.",
        });
        router.replace("/forgot-password");
        return;
      }

      Toast.show({
        type: "error",
        text1: "Reset failed",
        text2: result.message || "Something went wrong. Please try again.",
      });
    } catch (error) {
      console.error("❌ Reset error:", error);
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
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    loading,
    handleReset,
  };
};
