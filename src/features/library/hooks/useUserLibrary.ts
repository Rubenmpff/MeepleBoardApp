import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import { RootState } from "@/src/store/store";
import { useUser } from "@/src/features/users/hooks/useUser";

import {
  addLocalEntry,
  fetchUserLibrary,
  removeLocalEntry,
} from "../store/librarySlice";
import { UserGameLibrary } from "../types/UserGameLibrary";

export function useUserLibrary() {
  const { t } = useTranslation("library");
  const dispatch = useDispatch();
  const { user } = useUser();

  const library = useSelector(
    (state: RootState) => state.library.items
  );

  const loading = useSelector(
    (state: RootState) => state.library.loading
  );

  const error = useSelector(
    (state: RootState) => state.library.error
  );

  const refetch = useCallback(async () => {
    if (!user?.id) {
      console.warn(
        "[useUserLibrary] user.id em falta."
      );
      return;
    }

    try {
      await dispatch(
        fetchUserLibrary(user.id) as any
      ).unwrap();
    } catch {
      Toast.show({
        type: "error",
        text1: t("toast.loadErrorTitle"),
        text2: t("toast.loadErrorDescription"),
      });
    }
  }, [dispatch, t, user?.id]);

  const addEntry = useCallback(
    (entry: UserGameLibrary) =>
      dispatch(addLocalEntry(entry)),
    [dispatch]
  );

  const removeEntry = useCallback(
    (gameId: string) =>
      dispatch(removeLocalEntry(gameId)),
    [dispatch]
  );

  useEffect(() => {
    if (user?.id) {
      void refetch();
    }
  }, [refetch, user?.id]);

  return {
    library,
    loading,
    error,
    refetch,
    addLocalEntry: addEntry,
    removeLocalEntry: removeEntry,
  };
}
