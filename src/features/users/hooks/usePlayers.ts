// src/features/users/hooks/usePlayers.ts
import { useEffect, useState } from "react";
import { User } from "../types/User";
import { getUsers } from "../services/userService";

/**
 * Hook responsible for fetching and managing the list of players (users).
 */
export function usePlayers() {
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await getUsers();
        setPlayers(data);
        setError(null); // ✅ Clear error on success
      } catch (err) {
        console.error("❌ Failed to fetch players:", err);
        setError("Failed to fetch players.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  return { players, loading, error };
}
