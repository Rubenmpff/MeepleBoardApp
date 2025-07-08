// /app/index.tsx
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../constants/colors";
import * as SecureStore from "expo-secure-store";
import { tokenService } from "../services/tokenService";

export default function IndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      console.log("🚀 Bootstrapping...");

      const validToken = await tokenService.getValidToken();
      const remember = await SecureStore.getItemAsync("remember_me");

      console.log("🧠 Remember me flag:", remember);
      console.log("🔐 Token valid?", !!validToken);

      if (validToken && remember === "true") {
        console.log("✅ Valid and persistent session → navigating to dashboard");
        router.replace("/dashboard");
      } else {
        console.log("🔓 No persistent session → clearing and redirecting to welcome");
        await tokenService.clearAll();
        router.replace("/welcome");
      }

      setLoading(false);
    };

    bootstrap();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return null;
}
