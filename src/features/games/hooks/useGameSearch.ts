import { useState } from "react";
import { Game } from "../types/Game";
import gameService from "../services/gameService";

export const useGameSearch = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchGame = async (name: string): Promise<Game | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await gameService.searchOrImport(name);
      return result;
    } catch (err: any) {
      console.error("❌ Erro ao importar jogo:", err);
      setError("Erro ao importar jogo. Tenta novamente.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchGame, loading, error };
};
