import "react-native-gesture-handler";
import "react-native-get-random-values";

import { useEffect, useRef } from "react";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";

import CustomDrawerContent from "@/src/components/drawer/CustomDrawerContent";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";

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

  return (
    <Drawer
      backBehavior="history"
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
      screenOptions={{
        headerShown: false,

        /*
         * O Drawer é o menu secundário / "Mais".
         *
         * A app inteira já está dentro de um GestureHandlerRootView
         * no src/app/_layout.tsx, por isso não criamos outro aqui.
         *
         * Reservamos apenas uma pequena zona na margem esquerda para
         * o Drawer. Assim:
         *
         * - swipe iniciado na margem esquerda -> Drawer
         * - swipe no resto do ecrã -> mudança entre Tabs
         *
         * 40 px dá uma área confortável sem roubar demasiado espaço
         * ao pager das Tabs.
         */
        swipeEnabled: true,
        swipeEdgeWidth: 40,
        swipeMinDistance: 10,

        drawerPosition: "left",
        drawerType: "front",
        overlayColor: "rgba(0,0,0,0.22)",
        drawerActiveTintColor: COLORS.primary,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="friends/index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="friends/requests"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="friends/search"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="friends/[id]/index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="friends/[id]/games/[gameId]/index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="games/details/[id]"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="games/library/index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="games/search/index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="games/rankings/index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="games/matches/[id]/index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />
    </Drawer>
  );
}
