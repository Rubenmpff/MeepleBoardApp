import { useState } from "react";
import { useUser } from "@/src/features/users/hooks/useUser";
import libraryService from "../services/libraryService";

export function useRemoveGameFromLibrary() {
  const [loading, setLoading] = useState(false);
  const { user } = useUser(); // ← Ensures we have the current user

  const removeGame = async (gameId: string) => {
    if (!user?.id) throw new Error("User not authenticated.");

    setLoading(true);
    try {
      await libraryService.removeGameFromLibrary(user.id, gameId);
    } finally {
      setLoading(false);
    }
  };

  return { removeGame, loading };
}
