// src/features/auth/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { User } from "@/src/features/users/types/User";

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

type AnyJwt = Record<string, any>;

function decodeToken(token: string): User | null {
  try {
    const decoded: AnyJwt = jwtDecode(token);

    // ⚠️ NameIdentifier às vezes vem como URI no ASP.NET
    const nameId =
      decoded.sub ||
      decoded.nameid ||
      decoded.id ||
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

    const userName =
      decoded.unique_name ||
      decoded.userName ||
      decoded.name ||
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      "Unknown";

    if (!nameId) return null;

    return {
      id: String(nameId),
      userName: String(userName),
      email: decoded.email ? String(decoded.email) : undefined,
    };
  } catch (err) {
    console.error("Erro ao decodificar token:", err);
    return null;
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;

      if (action.payload) {
        // ✅ Guardar no SecureStore (mesma fonte da API)
        SecureStore.setItemAsync("secure_token", action.payload);
        state.user = decodeToken(action.payload);
      } else {
        SecureStore.deleteItemAsync("secure_token");
        state.user = null;
      }
    },

    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      SecureStore.deleteItemAsync("secure_token");
      SecureStore.deleteItemAsync("secure_refresh_token");
      SecureStore.deleteItemAsync("remember_me");
      SecureStore.deleteItemAsync("current_user");
    },
  },
});

export const { setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;