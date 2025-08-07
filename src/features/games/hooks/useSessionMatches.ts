import { useState, useEffect, useCallback } from "react";
import sessionService from "../services/sessionService";
import { MatchFormData } from "../types/MatchForm";

export function useSessionMatches(sessionId: string) {
  const [matches, setMatches] = useState<MatchFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      // ✅ usando sessionService
      const session = await sessionService.getById(sessionId);
      setMatches(session.matches ?? []);
    } catch (err) {
      console.error("❌ Error fetching session matches:", err);
      setError("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, error, fetchMatches };
}
