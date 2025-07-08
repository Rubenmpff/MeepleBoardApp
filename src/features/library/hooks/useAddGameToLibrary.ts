import { useState } from "react";
import Toast from "react-native-toast-message";
import { useGameSearch } from "../../games/hooks/useGameSearch";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { Game } from "../../games/types/Game";
import { useUser } from "@/src/features/users/hooks/useUser";
import libraryService from "../services/libraryService";

export const useAddGameToLibrary = () => {
  const { searchGame } = useGameSearch();
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);

  const addGameByName = async (
    name: string,
    status: GameLibraryStatus = GameLibraryStatus.Owned,
    pricePaid?: number
  ): Promise<Game | null> => {
    if (userLoading || !user?.id) {
      Toast.show({ type: "error", text1: "User not authenticated." });
      return null;
    }

    setLoading(true);

    try {
      const game = await searchGame(name);
      if (!game) throw new Error("Game not found.");

      await libraryService.addGameToLibrary(
        user.id,
        game.id,
        game.name,
        status,
        pricePaid
      );

      Toast.show({
        type: "success",
        text1: "Game added to library!",
        text2: `"${game.name}" is now part of your collection.`,
      });

      return game;
    } catch (err: any) {
      console.error("❌ Error adding game to library:", err);
      Toast.show({
        type: "error",
        text1: "Failed to add game",
        text2: "Check your connection or try again later.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    addGameByName,
    loading,
  };
};
