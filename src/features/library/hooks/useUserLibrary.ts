import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { UserGameLibrary } from "../types/UserGameLibrary";
import libraryService from "../services/libraryService";
import { useUser } from "@/src/features/users/hooks/useUser";

export function useUserLibrary() {
  const { user } = useUser();

  const [library, setLibrary] = useState<UserGameLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLibrary = async () => {
    if (!user?.id) {
      console.warn("⚠️ fetchLibrary: user.id missing → aborting");
      return;
    }

    try {
      setLoading(true);
      console.log("📚 [useUserLibrary] GET /users/:id/games →", user.id);

      const rawData = await libraryService.getUserLibrary(user.id);
      console.log("🛬 API response:", rawData);

      if (!Array.isArray(rawData)) {
        console.error("❌ Unexpected response format:", rawData);
        setLibrary([]);
        setError("Invalid data format.");
        return;
      }

      const adapted: UserGameLibrary[] = rawData
        .filter((item) => !!item.gameId && !!item.gameName)
        .map((item) => {
          const bggIdRaw = item.bggId ?? item.game?.bggId ?? null;
          const parsedBggId =
            bggIdRaw != null && !isNaN(Number(bggIdRaw)) ? Number(bggIdRaw) : undefined;

          return {
            ...item,
            gameId: String(item.gameId),
            bggId: parsedBggId,
            game: {
              id: String(item.gameId),
              name: item.gameName,
              imageUrl: item.gameImageUrl ?? null,
              bggId: parsedBggId,
            },
          };
        });

      console.log(`✅ Adapted library (${adapted.length} games)`);
      console.log("📦 Final adapted library:");
      adapted.forEach((entry, i) => {
        console.log(`[${i}]`, {
          gameId: entry.gameId,
          bggId: entry.bggId,
          name: entry.game?.name,
        });
      });

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

  useEffect(() => {
    fetchLibrary();
  }, [user?.id]);

  return {
    library,
    loading,
    error,
    refetch: fetchLibrary,
  };
}
