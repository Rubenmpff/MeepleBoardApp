import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import {
  addGameToLibrary,
  removeGameFromLibrary,
  fetchUserLibrary,
} from "../store/librarySlice";
import { Game } from "@/src/features/games/types/Game";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { useUser } from "@/src/features/users/hooks/useUser";
import api from "@/src/services/api";

export function useLibraryActions() {
  const dispatch = useDispatch();
  const { user } = useUser();
  const loading = useSelector((state: RootState) => state.library.loading);

  /** Adicionar jogo (importa se necessário) */
  const addGame = useCallback(
    async (
      game: Game,
      status: GameLibraryStatus = GameLibraryStatus.Owned,
      pricePaid?: number
    ) => {
      if (!user?.id) throw new Error("User not authenticated.");

      let gameIdToAdd = game.id;

      // Importar se não existir localmente mas tem BGG ID
      if (!game.id && game.bggId) {
        const res = await api.post(`/game/import/${game.bggId}`);
        if (res?.data?.id) {
          gameIdToAdd = res.data.id;
        } else {
          throw new Error(`Failed to import game with BGG ID ${game.bggId}`);
        }
      }

      if (!gameIdToAdd) throw new Error(`Game "${game.name}" does not have a valid ID.`);

      await dispatch(
        addGameToLibrary({
          userId: user.id,
          gameId: gameIdToAdd,
          gameName: game.name,
          status,
          pricePaid,
        }) as any
      ).unwrap();
    },
    [dispatch, user?.id]
  );

  /** Remover jogo */
  const removeGame = useCallback(
    async (gameId: string) => {
      if (!user?.id) throw new Error("User not authenticated.");
      await dispatch(
        removeGameFromLibrary({ userId: user.id, gameId }) as any
      ).unwrap();
    },
    [dispatch, user?.id]
  );

  /** Recarregar biblioteca */
  const refetchLibrary = useCallback(() => {
    if (!user?.id) return;
    dispatch(fetchUserLibrary(user.id) as any);
  }, [dispatch, user?.id]);

  return { addGame, removeGame, refetchLibrary, loading };
}
