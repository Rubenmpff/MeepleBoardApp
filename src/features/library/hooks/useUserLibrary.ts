// src/features/library/hooks/useUserLibrary.ts
import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";


import { useUser } from "@/src/features/users/hooks/useUser";
import { UserGameLibrary } from "../types/UserGameLibrary";
import { RootState } from "@/src/store/store";
import { addLocalEntry, fetchUserLibrary, removeLocalEntry } from "../store/librarySlice";

export function useUserLibrary() {
  const dispatch = useDispatch();
  const { user } = useUser();

  const library = useSelector((state: RootState) => state.library.items);
  const loading = useSelector((state: RootState) => state.library.loading);
  const error = useSelector((state: RootState) => state.library.error);

  const refetch = useCallback(() => {
    if (!user?.id) {
      console.warn("⚠️ [useUserLibrary] fetchLibrary → user.id is missing");
      return;
    }
    dispatch(fetchUserLibrary(user.id) as any)
      .unwrap()
      .catch(() => {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to load your game library.",
        });
      });
  }, [user?.id, dispatch]);

  const addEntry = useCallback(
    (entry: UserGameLibrary) => dispatch(addLocalEntry(entry)),
    [dispatch]
  );

  const removeEntry = useCallback(
    (gameId: string) => dispatch(removeLocalEntry(gameId)),
    [dispatch]
  );

  useEffect(() => {
    if (user?.id) refetch();
  }, [user?.id, refetch]);

  return {
    library,
    loading,
    error,
    refetch,
    addLocalEntry: addEntry,
    removeLocalEntry: removeEntry,
  };
}
