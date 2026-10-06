import "react-native-gesture-handler";
import "react-native-get-random-values";

import { useEffect, useRef } from "react";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";


type RemovableSubscription = {
  remove: () => void;
};

export default function AppLayout() {
  const router = useRouter();

  const notificationListener =
    useRef<RemovableSubscription | null>(null);

  const responseListener =
    useRef<RemovableSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const isExpoGo =
      Constants.appOwnership === "expo";

    if (isExpoGo) {
      console.log(
        "ℹ️ Expo Go detetado: notificações push remotas desativadas neste ambiente."
      );

      return () => {
        isMounted = false;
      };
    }

    const setupNotifications = async () => {
      try {
        const Notifications =
          await import("expo-notifications");

        const notificationService =
          await import(
            "@/src/services/notificationService"
          );

        if (!isMounted) {
          return;
        }

        await notificationService.initPushNotifications();

        if (!isMounted) {
          return;
        }

        notificationListener.current =
          Notifications.addNotificationReceivedListener(
            (notification) => {
              console.log(
                "Notificação recebida:",
                notification
              );
            }
          );

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener(
            (response) => {
              const data =
                response.notification.request.content.data as
                  typeof response.notification.request.content.data;

              const route =
                notificationService.getRouteFromNotification(
                  data as any
                );

              if (route) {
                router.push(route as never);
              }
            }
          );
      } catch (error) {
        console.error(
          "Erro ao inicializar notificações:",
          error
        );
      }
    };

    void setupNotifications();

    return () => {
      isMounted = false;

      notificationListener.current?.remove();
      responseListener.current?.remove();

      notificationListener.current = null;
      responseListener.current = null;
    };
  }, [router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
