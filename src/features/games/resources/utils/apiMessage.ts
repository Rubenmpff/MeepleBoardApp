import { friendlyErrorMessage } from "@/src/services/api";

/** Why a request was refused (duplicate link, invalid address…), translated and never technical. */
export function apiMessage(error: unknown): string | null {
  return friendlyErrorMessage(error);
}
