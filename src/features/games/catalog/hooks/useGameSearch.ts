import { useCallback, useState } from "react";

import gameService from "../services/gameService";
import { Game } from "../types/Game";

export const useGameSearch = () => {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Método principal para selecionar um jogo vindo
   * das sugestões.
   *
   * Usa o BGG ID para garantir que recebemos exatamente
   * o jogo escolhido pelo utilizador.
   */
  const searchGameByBggId = useCallback(
    async (
      bggId: number
    ): Promise<Game | null> => {
      setLoading(true);
      setError(null);

      try {
        return await gameService.searchOrImportByBggId(
          bggId
        );
      } catch (err) {
        console.error(
          "❌ Erro ao carregar jogo por BGG ID:",
          err
        );

        setError(
          "Não foi possível carregar o jogo. Tenta novamente."
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Mantemos temporariamente a pesquisa por nome
   * para não quebrar outros componentes que possam
   * ainda estar a utilizá-la.
   *
   * No GameSelector vamos deixar de usar este método.
   */
  const searchGame = useCallback(
    async (
      name: string
    ): Promise<Game | null> => {
      setLoading(true);
      setError(null);

      try {
        return await gameService.searchOrImport(
          name
        );
      } catch (err) {
        console.error(
          "❌ Erro ao carregar jogo por nome:",
          err
        );

        setError(
          "Não foi possível carregar o jogo. Tenta novamente."
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchGame,
    searchGameByBggId,
    loading,
    error,
    clearError,
  };
};