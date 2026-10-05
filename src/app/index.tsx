// /app/index.tsx
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../constants/colors";
import { ROUTES } from "../constants/routes";
import { tokenService } from "../services/tokenService";

export default function IndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      console.log("🚀 Bootstrapping...");

      try {
        const validToken = await tokenService.getValidToken();
        console.log("🔐 Token valid?", !!validToken);

        if (validToken) {
          // ✅ entra no grupo (app) onde está o Drawer
          router.replace(ROUTES.HOME);
        } else {
          // ✅ sem token → limpa e volta ao welcome
          await tokenService.clearAll();
          router.replace("/welcome");
        }
      } catch (err) {
        console.warn("❌ Bootstrap failed:", err);
        await tokenService.clearAll();
        router.replace("/welcome");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return null;
}
