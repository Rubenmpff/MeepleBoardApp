// src/features/library/hooks/useUserLibrary.ts
// -------------------------------------------------------------
// Hook responsible for fetching the user's library,
// adapting it for the frontend, and exposing loading/error.
// Now also adds `bggId` to the `game` object to ensure that
// "already in library?" checks work in GameSearchScreen.
// -------------------------------------------------------------

import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { UserGameLibrary } from "../types/UserGameLibrary";
import libraryService from "../services/libraryService";
import { useUser } from "@/src/features/users/hooks/useUser";

export function useUserLibrary() {
  /* ─── 1. Current user (need the ID) ─── */
  const { user } = useUser();

  /* ─── 2. Hook state ─── */
  const [library, setLibrary] = useState<UserGameLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ───────────────────────────────────────────────
   * Loads user library from backend and adapts fields
   * ─────────────────────────────────────────────── */
  const fetchLibrary = async () => {
    // 2.1 Safety check
    if (!user?.id) {
      console.warn("⚠️ fetchLibrary: user.id missing → aborting");
      return;
    }

    try {
      setLoading(true);
      console.log("📚 [useUserLibrary] GET /users/:id/games  →", user.id);

      // 2.2 API call
      const rawData = await libraryService.getUserLibrary(user.id);
      console.log("🛬 API response:", rawData);

      // 2.3 Validate array
      if (!Array.isArray(rawData)) {
        console.error("❌ Unexpected response format:", rawData);
        setLibrary([]);
        setError("Invalid data format.");
        return;
      }

      // 2.4 Normalize/Adapt data:
      // - includes bggId if returned from backend
      // - ensures the UI always gets a game{} field
      const adapted: UserGameLibrary[] = rawData.map((item, idx) => {
        if (!item.gameId || !item.gameName) {
          console.warn(`⚠️ Incomplete item at index ${idx}:`, item);
        }

        return {
          ...item,
          game: {
            id: item.gameId,
            name: item.gameName,
            imageUrl: item.gameImageUrl,
            bggId: item.bggId ?? undefined,
          },
        };
      });

      console.log(`✅ Adapted library (${adapted.length} games)`);
      setLibrary(adapted);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch library:", err);
      setError("Could not load your library.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to load your game library.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ─── 3. Load library on user.id change ─── */
  useEffect(() => {
    fetchLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ─── 4. Public interface ─── */
  return {
    library,        // normalized list
    loading,        // loading flag
    error,          // error message or null
    refetch: fetchLibrary, // to trigger refresh manually
  };
}
