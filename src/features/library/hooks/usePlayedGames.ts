import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useUser } from "@/src/features/users/hooks/useUser";
import { fetchPlayedGames } from "../store/librarySlice";

export function usePlayedGames() {
  const dispatch = useDispatch();
  const { user } = useUser();

  const playedGames = useSelector((state: RootState) => state.library.playedGames);
  const loading = useSelector((state: RootState) => state.library.playedGamesLoading);

  const refetch = useCallback(() => {
    if (!user?.id) return;
    dispatch(fetchPlayedGames(user.id) as any);
  }, [dispatch, user?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { playedGames, loading, refetch };
}