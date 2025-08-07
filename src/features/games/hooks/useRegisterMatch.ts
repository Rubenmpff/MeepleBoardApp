import { useState } from "react";
import { registerMatch } from "../services/matchService";
import { MatchFormData } from "../types/MatchForm";

export function useRegisterMatch() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const submitMatch = async (data: MatchFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await registerMatch(data);
      console.log("✅ Match successfully registered:", result);
      return true;
    } catch (err: any) {
      console.error("❌ Failed to register match:", err);
      setError("Failed to register match. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitMatch,
    loading,
    error,
  };
}
