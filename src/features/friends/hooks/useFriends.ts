// src/features/friends/hooks/useFriends.ts
import { useEffect, useState } from "react";
import { getMyFriends, FriendLite } from "../services/friendshipService";

export function useFriends() {
  const [friends, setFriends] = useState<FriendLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await getMyFriends();
        setFriends(data);
        setError(null);
      } catch (e) {
        setError("Failed to load friends.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return { friends, loading, error };
}
