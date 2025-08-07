import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { GameSession } from "../types/GameSession";
import sessionService from "../services/sessionService";

export function useGameSessions() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pega o utilizador logado do Redux
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch (err) {
      console.error("❌ Error fetching sessions:", err);
      setError("Failed to load game sessions");
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (name: string, location?: string) => {
    if (!userId) {
      console.error("❌ No logged user to set as organizer");
      setError("User not logged");
      return null;
    }
    try {
      const newSession = await sessionService.create({
        name,
        organizerId: userId,
        location,
      });
      setSessions((prev) => [...prev, newSession]);
      return newSession;
    } catch (err) {
      console.error("❌ Error creating session:", err);
      setError("Failed to create session");
      return null;
    }
  };

  const closeSession = async (id: string) => {
    try {
      await sessionService.close(id);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isActive: false, endDate: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      console.error("❌ Error closing session:", err);
      setError("Failed to close session");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return { sessions, loading, error, fetchSessions, createSession, closeSession };
}
