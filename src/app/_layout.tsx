// /app/(auth)/_layout.tsx
import { useEffect } from "react";
import { View } from "react-native";
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

      const parsed = Linking.parse(url);
      let path = parsed.path || new URL(url).pathname.replace("/", "");

      if (!path) return;

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
    Linking.getInitialURL().then((url) => url && handleDeepLink({ url }));

    return () => subscription.remove();
  }, [router]);

  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <Slot />
        <Toast />
      </View>
    </Provider>
  );
}
