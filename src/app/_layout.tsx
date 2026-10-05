import "@/src/i18n";

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { Slot, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import {
  Provider,
  useDispatch,
} from "react-redux";

import { COLORS } from "@/src/constants/colors";
import { setToken } from "@/src/features/auth/store/authSlice";
import { initializeLanguage } from "@/src/i18n";
import { store } from "@/src/store/store";

function AppBootstrapper({
  onReady,
}: {
  onReady: () => void;
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const [token] = await Promise.all([
          SecureStore.getItemAsync("secure_token"),
          initializeLanguage(),
        ]);

        dispatch(setToken(token ?? null));
      } catch (error) {
        console.error(
          "Erro ao inicializar a aplicação:",
          error
        );

        dispatch(setToken(null));
      } finally {
        if (isMounted) {
          onReady();
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [dispatch, onReady]);

  return null;
}

function AppContent() {
  const router = useRouter();

  useEffect(() => {
    function handleDeepLink({
      url,
    }: {
      url: string;
    }) {
      if (!url) {
        return;
      }

      try {
        const decodedUrl = decodeURIComponent(url);
        const parsed = Linking.parse(decodedUrl);

        let fallbackPath = "";

        try {
          fallbackPath = new URL(decodedUrl).pathname.replace(
            /^\/+/,
            ""
          );
        } catch {
          fallbackPath = "";
        }

        const path = parsed.path ?? fallbackPath;

        if (!path) {
          return;
        }

        const params = parsed.queryParams as
          | Record<string, string | string[]>
          | undefined;

        if (path.includes("confirm-email")) {
          router.push({
            pathname: "/(auth)/confirm-email",
            params,
          });

          return;
        }

        if (path.includes("reset-password")) {
          router.push({
            pathname: "/(auth)/reset-password",
            params,
          });
        }
      } catch (error) {
        console.error(
          "Erro ao processar deep link:",
          error
        );
      }
    }

    const subscription = Linking.addEventListener(
      "url",
      handleDeepLink
    );

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      })
      .catch((error) => {
        console.error(
          "Erro ao obter o deep link inicial:",
          error
        );
      });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Slot />
      <Toast />
    </View>
  );
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);

  const handleAppReady = useCallback(() => {
    setIsAppReady(true);
  }, []);

  return (
    <Provider store={store}>
      <AppBootstrapper onReady={handleAppReady} />

      {isAppReady ? (
        <AppContent />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        </View>
      )}
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});