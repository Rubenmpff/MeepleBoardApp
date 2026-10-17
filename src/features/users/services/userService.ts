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
export type DeletionMember = { id: string; userName: string };
export type DeletionCampaign = { id: string; name: string; gameName: string | null; hasNotes: boolean; members: DeletionMember[] };
export type DeletionSummary = { scheduledSessions: number; runningSessions: number; campaignsWithMembers: DeletionCampaign[]; campaignsOnlyYours: number };

/** What deleting the account would affect: sessions organized and campaigns created with other active members. */
export const getDeletionSummary = async (): Promise<DeletionSummary> => (await api.get("/users/me/deletion-summary")).data;

/** Deletes the signed-in account; each campaign may get a new manager among its active members. */
export const deleteOwnAccount = async (password: string, campaignTransfers: { campaignId: string; newManagerId: string }[]): Promise<void> => {
  await api.delete("/users/me", { data: { password, campaignTransfers } });
};
