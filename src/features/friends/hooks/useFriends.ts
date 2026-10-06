import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";

import {
  FriendLite,
  getMyFriends,
} from "../services/friendshipService";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFriends: FriendLite[] | null = null;
let cachedAt = 0;
let cachedToken: string | null = null;

export function invalidateFriendsCache() {
  cachedFriends = null;
  cachedAt = 0;
  cachedToken = null;
}

export function useFriends() {
  const { t } = useTranslation("friends");

  const [friends, setFriends] = useState<FriendLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (force = true) => {
    try {
      setLoading(true);
      setError(null);
      const token = await SecureStore.getItemAsync("secure_token");
      if (!force && token && token === cachedToken && cachedFriends && Date.now() - cachedAt < CACHE_TTL_MS) {
        setFriends(cachedFriends);
        return;
      }
      setFriends([]);

      const data = await getMyFriends();
      // An in-flight request must not repopulate another account's cache.
      if (token !== await SecureStore.getItemAsync("secure_token")) return;

      setFriends(data ?? []);
      cachedFriends = data ?? [];
      cachedAt = Date.now();
      cachedToken = token;
    } catch (error) {
      console.error(
        "Erro ao carregar amigos:",
        error
      );

      setFriends([]);
      setError(t("errors.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refetch(true);
  }, [refetch]);

  return {
    friends,
    loading,
    error,
    refetch,
  };
}
