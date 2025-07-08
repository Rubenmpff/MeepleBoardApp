// src/features/users/services/userService.ts

import api from "@/src/services/api";
import { User } from "../types/User";

/**
 * Fetches the list of all users from the backend.
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get("/MeepleBoard/users");
  return response.data;
};

/**
 * Fetches the currently authenticated user from the backend.
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get("/MeepleBoard/users/me");
  return response.data;
};
