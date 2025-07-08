// src/features/games/services/matchService.ts

import api from "@/src/services/api";
import { MatchFormData, LastMatch } from "../types/Match";

/**
 * Registers a new match in the system.
 * Throws an error if submission fails.
 */
export const registerMatch = async (data: MatchFormData): Promise<any> => {
  try {
    const response = await api.post("/Match", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to register match:", error?.response || error?.message || error);
    throw new Error("Failed to register match. Please check your input and try again.");
  }
};

/**
 * Fetches the most recently registered match.
 * Returns null if no match is found (404).
 */
export const getLastMatch = async (): Promise<LastMatch | null> => {
  try {
    const response = await api.get<LastMatch>("/Match/last");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;

    console.error("❌ Failed to fetch last match:", error);
    throw new Error("Failed to fetch last match. Please try again later.");
  }
};
