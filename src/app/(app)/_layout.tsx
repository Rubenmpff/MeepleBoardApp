// app/(app)/_layout.tsx

import 'react-native-get-random-values';

import { useEffect, useRef } from "react";
import { Drawer } from "expo-router/drawer";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import CustomDrawerContent from "@/src/components/drawer/CustomDrawerContent";
import {
  initPushNotifications,
  getRouteFromNotification,
  NotificationData,
} from "@/src/services/notificationService";

export default function DrawerLayout() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // ── Inicializa notificações push ─────────────────────────────────────
    initPushNotifications();

    // ── Notificação recebida com a app aberta ────────────────────────────
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Notificação recebida:", notification);
      }
    );

    // ── Utilizador carregou na notificação ───────────────────────────────
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        const route = getRouteFromNotification(data);

        if (route) {
          console.log("🔗 Navegar para:", route);
          router.push(route as any);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: "#6200EE",
        drawerLabelStyle: { marginLeft: -20, fontSize: 15 },
      }}
    >
      <Drawer.Screen
        name="dashboard/index"
        options={{ drawerLabel: "Home" }}
      />
    </Drawer>
  );
}