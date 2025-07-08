import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

export const getUserId = async (): Promise<string | null> => {
  const token = await SecureStore.getItemAsync("secure_token");
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token);
    return decoded.sub || decoded.nameid || decoded.id || null;
  } catch (err) {
    console.error("Erro ao decodificar token:", err);
    return null;
  }
};
