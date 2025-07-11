import { useState } from "react";
import Toast from "react-native-toast-message";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { Game } from "../../games/types/Game";
import { useUser } from "@/src/features/users/hooks/useUser";
import libraryService from "../services/libraryService";
import api from "@/src/services/api";

export const useAddGameToLibrary = () => {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);

  const addGame = async (
    game: Game,
    status: GameLibraryStatus = GameLibraryStatus.Owned,
    pricePaid?: number
  ): Promise<Game | null> => {
    if (userLoading || !user?.id) {
      Toast.show({ type: "error", text1: "User not authenticated." });
      return null;
    }

    setLoading(true);

    try {
      let gameToAdd = game;

      // Importar se não tiver ID local
      if (!game.id && game.bggId) {
        try {
          const res = await api.post(`/game/import/${game.bggId}`);
          gameToAdd = res.data;
          console.log("✅ Game imported:", gameToAdd);
        } catch (importErr) {
          console.error("❌ Failed to import game:", importErr);
          throw new Error(`Failed to import "${game.name}" from BGG.`);
        }
      }

      if (!gameToAdd.id) {
        throw new Error(`Game "${game.name}" does not have a valid local ID.`);
      }

      await libraryService.addGameToLibrary(
        user.id,
        gameToAdd.id,
        gameToAdd.name,
        status,
        pricePaid
      );

      Toast.show({
        type: "success",
        text1: "Game added to library!",
        text2: `"${gameToAdd.name}" is now part of your collection.`,
      });

      return gameToAdd;
    } catch (err: any) {
  console.error("❌ Error adding game to library:", err);

  if (err?.response?.status === 409) {
    Toast.show({
      type: "info",
      text1: "Game already in library",
      text2: `"${game.name}" is already part of your collection.`,
    });
    return game; // continua o fluxo normalmente
  }

  Toast.show({
    type: "error",
    text1: "Failed to add game",
    text2: err.message ?? "Check your connection or try again later.",
  });

  return null;
}
 finally {
      setLoading(false);
    }
  };

  return {
    addGame,
    loading,
  };
};
