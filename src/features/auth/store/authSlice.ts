// src/features/auth/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Função auxiliar para decodificar o JWT
function decodeToken(token: string): User | null {
  try {
    const decoded: any = jwtDecode(token);
    return {
      id: decoded.sub || decoded.nameid || decoded.id,
      userName: decoded.unique_name || decoded.userName || "Unknown",
      email: decoded.email || undefined,
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
        AsyncStorage.setItem("token", action.payload);
        state.user = decodeToken(action.payload);
      } else {
        AsyncStorage.removeItem("token");
        state.user = null;
      }
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      AsyncStorage.removeItem("token");
    },
  },
});

export const { setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
