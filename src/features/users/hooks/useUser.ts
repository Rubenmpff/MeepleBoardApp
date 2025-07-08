import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/userService";
import { User } from "../types/User";
import * as SecureStore from "expo-secure-store";

/**
 * Hook that handles fetching and caching the current authenticated user.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync("current_user");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const data = await getCurrentUser();
          setUser(data);
          await SecureStore.setItemAsync("current_user", JSON.stringify(data));
        }
      } catch (err) {
        console.warn("❌ Invalid user or expired token → logging out");
        await SecureStore.deleteItemAsync("current_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { user, loading };
}
