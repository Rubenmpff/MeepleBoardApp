// src/features/users/services/userService.ts

import api from "@/src/services/api";
import { LibraryPrivacy, User } from "../types/User";

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateLibraryPrivacy = async (privacy: LibraryPrivacy): Promise<void> => {
  await api.patch("/users/me/library-privacy", { libraryPrivacy: privacy });
};

/** Turns this account's contribution to community duration statistics on or off. */
export const updateDurationSharing = async (enabled: boolean): Promise<void> => {
  await api.patch("/users/me/duration-sharing", { enabled });
};