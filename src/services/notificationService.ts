// src/services/notificationService.ts
//
// Serviço de notificações push via Expo Notifications.
//
// Fluxo:
//   1. App abre → registerForPushNotificationsAsync() obtém o token
//   2. Token é enviado ao backend → guardado no User.ExpoPushToken
//   3. Backend envia notificações quando há eventos relevantes
//   4. App recebe e navega para o ecrã correto

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import api from "./api";

// ── Configuração global de como as notificações aparecem ────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Regista o dispositivo e obtém o token ───────────────────────────────────

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Notificações push só funcionam em dispositivos físicos
  if (!Device.isDevice) {
    console.log("ℹ️ Push notifications não disponíveis no emulador.");
    return null;
  }

  // Verifica e pede permissão
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("⚠️ Permissão de notificações negada.");
    return null;
  }

  // Obtém o Expo Push Token
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("⚠️ Expo projectId não encontrado. Configura o eas.projectId no app.json.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    console.log("✅ Expo Push Token obtido:", token);

    // Configuração específica para Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "MeepleBoard",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (err) {
    console.error("❌ Erro ao obter Expo Push Token:", err);
    return null;
  }
}

// ── Envia o token ao backend ─────────────────────────────────────────────────

export async function syncPushTokenWithBackend(token: string): Promise<void> {
  try {
    await api.post("/users/push-token", { expoPushToken: token });
    console.log("✅ Push token sincronizado com o backend.");
  } catch (err) {
    // Silencioso — não deve bloquear o utilizador
    console.warn("⚠️ Erro ao sincronizar push token:", err);
  }
}

// ── Inicializa notificações (chama no _layout.tsx) ───────────────────────────

export async function initPushNotifications(): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await syncPushTokenWithBackend(token);
  }
}

// ── Handlers de notificação recebida ─────────────────────────────────────────

export type NotificationData = {
  type: "match_created" | "journal_entry_added" | "journal_closed" | "campaign_invite";
  matchId?: string;
  campaignId?: string;
};

/**
 * Retorna a rota para navegar quando o utilizador carrega na notificação.
 */
export function getRouteFromNotification(data: NotificationData): string | null {
  switch (data.type) {
    case "match_created":
    case "journal_entry_added":
    case "journal_closed":
      if (data.matchId)
        return `/(app)/games/matches/${data.matchId}/journal`;
      return "/(app)/games/pending-journal";

    case "campaign_invite":
      return "/(app)/games/campaigns";

    default:
      return null;
  }
}