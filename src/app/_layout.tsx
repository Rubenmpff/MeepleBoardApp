// /app/(auth)/_layout.tsx

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { Slot, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import Toast from "react-native-toast-message";

export default function AuthLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      let url = event.url;
      if (!url) return;

      url = decodeURIComponent(url);
      console.log("🔗 Deep link received:", url);

      const parsed = Linking.parse(url);
      console.log("📌 Parsed path:", parsed.path);
      console.log("🧐 Query params:", parsed.queryParams);

      let path = parsed.path || new URL(url).pathname.replace("/", "");
      console.log("📌 Adjusted path:", path);

      if (!path) {
        console.warn("⚠️ Could not detect deep link path.");
        return;
      }

      if (path.includes("confirm-email")) {
        router.push({
          pathname: "/(auth)/confirm-email",
          params: parsed.queryParams as Record<string, string>,
        });
      } else if (path.includes("reset-password")) {
        router.push({
          pathname: "/(auth)/reset-password",
          params: parsed.queryParams as Record<string, string>,
        });
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Provider store={store}>
      <Slot />
      <Toast /> {/* ✅ Global toast */}
    </Provider>
  );
}
