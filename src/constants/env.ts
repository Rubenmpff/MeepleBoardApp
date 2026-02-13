// src/constants/env.ts
import { Platform } from "react-native";
import Constants from "expo-constants";

// Valores por máquina (vem do .env)
const PORT = process.env.EXPO_PUBLIC_API_PORT ?? "5000";
const BASE_PATH = process.env.EXPO_PUBLIC_API_BASEPATH ?? "/MeepleBoard";

// Resolve host automaticamente
function getHost() {
  // Android Emulator (Mac/Windows)
  if (Platform.OS === "android" && !Constants.isDevice) {
    return "10.0.2.2";
  }

  // iPhone (Expo Go) e iOS Simulator:
  // o Expo sabe o IP do computador que está a servir o bundle
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ?? "localhost";
}

const ENV = {
  development: {
    API_URL: `http://${getHost()}:${PORT}${BASE_PATH}`,
  },
  production: {
    API_URL: `https://api.meepleboard.com${BASE_PATH}`,
  },
  staging: {
    API_URL: `https://staging.meepleboard.com${BASE_PATH}`,
  },
};

const getEnvVars = () => (__DEV__ ? ENV.development : ENV.production);

export default getEnvVars;
