// src/features/auth/hooks/useRegister.ts

import { useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { authService } from "../services/authService";

// ✅ Email format validation
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// ✅ Password: 8+ chars, 1 uppercase, 1 number, 1 special character
const isStrongPassword = (password: string) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

export const useRegister = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Handles sign up form submission */
  const handleSignUp = async () => {
    // 🔎 Basic validations
    if (!username || !email || !password || !confirmPassword) {
      return Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Please fill in all required fields.",
      });
    }

    if (!isValidEmail(email)) {
      return Toast.show({
        type: "error",
        text1: "Invalid email",
        text2: "Please provide a valid email address.",
      });
    }

    if (!isStrongPassword(password)) {
      return Toast.show({
        type: "error",
        text1: "Weak password",
        text2:
          "Password must contain 8+ characters, one uppercase letter, one number, and one special character (!@#-_).",
      });
    }

    if (password !== confirmPassword) {
      return Toast.show({
        type: "error",
        text1: "Passwords don’t match",
        text2: "Please make sure both passwords are the same.",
      });
    }

    if (!acceptTerms) {
      return Toast.show({
        type: "error",
        text1: "Terms not accepted",
        text2: "You must accept the Terms and Privacy Policy to continue.",
      });
    }

    setLoading(true);

    try {
      const res = await authService.register({
        username,
        email: email.trim().toLowerCase(),
        password,
        isMobile: true,
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Account created 🎉",
          text2: "Check your email to confirm your account.",
        });
        router.replace("/signin");
      } else {
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: res.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
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
  };
};
