import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  FriendLite,
  getMyFriends,
} from "../services/friendshipService";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFriends: FriendLite[] | null = null;
let cachedAt = 0;

export function invalidateFriendsCache() {
  cachedFriends = null;
  cachedAt = 0;
}

export function useFriends() {
  const { t } = useTranslation("friends");

  const [friends, setFriends] = useState<FriendLite[]>(cachedFriends ?? []);
  const [loading, setLoading] = useState(cachedFriends === null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (force = true) => {
    if (!force && cachedFriends && Date.now() - cachedAt < CACHE_TTL_MS) {
      setFriends(cachedFriends);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const data = await getMyFriends();

      setFriends(data ?? []);
      cachedFriends = data ?? [];
      cachedAt = Date.now();
    } catch (error) {
      console.error(
        "Erro ao carregar amigos:",
        error
      );

      if (!cachedFriends) setFriends([]);
      setError(t("errors.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refetch(false);
  }, [refetch]);

  return {
    friends,
    loading,
    error,
    refetch,
  };
}
