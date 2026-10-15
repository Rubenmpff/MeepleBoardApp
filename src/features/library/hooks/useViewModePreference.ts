// src/features/library/hooks/useViewModePreference.ts
import { useAccountPreference } from "@/src/shared/hooks/useAccountMemory";

export type ViewMode = "grid" | "list";

/** Grid or list in the library, saved on the device for the signed-in account. */
export function useViewModePreference() {
  const { value: viewMode, setValue: setViewMode, loaded } = useAccountPreference<ViewMode>("collection-view-mode", "grid", v => v === "grid" || v === "list", "collection_view_mode");
  return { viewMode, setViewMode, loaded };
}
