// src/features/library/hooks/useViewModePreference.ts
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "collection_view_mode";
export type ViewMode = "grid" | "list";

export function useViewModePreference() {
  const [viewMode, setViewModeState] = useState<ViewMode>("grid");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "grid" || saved === "list") setViewModeState(saved);
      setLoaded(true);
    });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, []);

  return { viewMode, setViewMode, loaded };
}