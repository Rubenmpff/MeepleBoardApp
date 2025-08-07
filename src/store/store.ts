import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store/authSlice";
import libraryReducer from "@/src/features/library/store/librarySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    library: libraryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
