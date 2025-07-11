import { useUser } from "@/src/features/users/hooks/useUser";
import libraryService from "../services/libraryService";
import { useState } from "react";
import { GameLibraryStatus } from "../types/GameLibraryStatus";

export function useUpdateLibraryEntry() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const update = async (
    gameId: string,
    status: GameLibraryStatus,
    pricePaid?: number
  ) => {
    if (!user?.id) throw new Error("User not authenticated.");

    setLoading(true);
    try {
      await libraryService.updateGameInLibrary(user.id, gameId, status, pricePaid);
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}
