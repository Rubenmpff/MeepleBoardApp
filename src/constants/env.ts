// src/constants/env.ts

import Constants from "expo-constants";
import { Platform } from "react-native";

export type ApiMode = "local" | "tunnel" | "qa" | "production";

type EnvironmentConfig = {
  API_URL: string;
  API_MODE: ApiMode;
};

const API_MODE = normalizeApiMode(
  process.env.EXPO_PUBLIC_API_MODE
);

const API_PORT =
  process.env.EXPO_PUBLIC_API_PORT?.trim() || "5000";

const API_BASE_PATH = normalizeBasePath(
  process.env.EXPO_PUBLIC_API_BASEPATH
);

const TUNNEL_API_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_TUNNEL_API_URL
);

const QA_API_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_QA_API_URL
);

const PRODUCTION_API_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_PRODUCTION_API_URL
);

function normalizeApiMode(
  value: string | undefined
): ApiMode {
  const normalizedValue =
    value?.trim().toLowerCase();

  switch (normalizedValue) {
    case "tunnel":
      return "tunnel";

    case "qa":
      return "qa";

    case "production":
      return "production";

    default:
      return "local";
  }
}

function normalizeBasePath(
  value: string | undefined
): string {
  const normalizedValue =
    value?.trim() || "/MeepleBoard";

  return `/${normalizedValue
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")}`;
}

function normalizeUrl(
  value: string | undefined
): string {
  return value?.trim().replace(/\/+$/, "") || "";
}

function ensureHttps(
  url: string,
  variableName: string
): string {
  if (!url) {
    throw new Error(
      `${variableName} não está configurado.`
    );
  }

  if (!url.startsWith("https://")) {
    throw new Error(
      `${variableName} deve começar por https://.`
    );
  }

  return url;
}

function getExpoHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const withoutProtocol =
    hostUri.replace(/^https?:\/\//, "");

  return withoutProtocol.split(":")[0] || null;
}

function getLocalHost(): string {
  if (
    Platform.OS === "android" &&
    !Constants.isDevice
  ) {
    return "10.0.2.2";
  }

  return getExpoHost() ?? "localhost";
}

function buildLocalApiUrl(): string {
  return `http://${getLocalHost()}:${API_PORT}${API_BASE_PATH}`;
}

function buildTunnelApiUrl(): string {
  const url = ensureHttps(
    TUNNEL_API_URL,
    "EXPO_PUBLIC_TUNNEL_API_URL"
  );

  return `${url}${API_BASE_PATH}`;
}

function buildQaApiUrl(): string {
  const url = ensureHttps(
    QA_API_URL,
    "EXPO_PUBLIC_QA_API_URL"
  );

  return `${url}${API_BASE_PATH}`;
}

function buildProductionApiUrl(): string {
  const url = ensureHttps(
    PRODUCTION_API_URL,
    "EXPO_PUBLIC_PRODUCTION_API_URL"
  );

  return `${url}${API_BASE_PATH}`;
}

const getEnvVars = (): EnvironmentConfig => {
  switch (API_MODE) {
    case "tunnel":
      return {
        API_MODE,
        API_URL: buildTunnelApiUrl(),
      };

    case "qa":
      return {
        API_MODE,
        API_URL: buildQaApiUrl(),
      };

    case "production":
      return {
        API_MODE,
        API_URL: buildProductionApiUrl(),
      };

    default:
      return {
        API_MODE: "local",
        API_URL: buildLocalApiUrl(),
      };
  }
};

export default getEnvVars;