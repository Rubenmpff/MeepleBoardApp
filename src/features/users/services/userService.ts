// src/features/users/services/userService.ts

import api from "@/src/services/api";
import { LibraryPrivacy, User } from "../types/User";

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get("/users");
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateLibraryPrivacy = async (privacy: LibraryPrivacy): Promise<void> => {
  await api.patch("/users/me/library-privacy", { libraryPrivacy: privacy });
};