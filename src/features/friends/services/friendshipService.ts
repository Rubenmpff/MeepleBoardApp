// src/features/friends/services/friendshipService.ts
import api from "@/src/services/api";

export type FriendLite = { id: string; userName: string };

export const getMyFriends = async (): Promise<FriendLite[]> => {
  const res = await api.get("/friendships");
  return res.data;
};
