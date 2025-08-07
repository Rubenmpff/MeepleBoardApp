// src/features/games/types/MatchPlayer.ts

/**
 * Representa os dados de um jogador dentro de uma partida.
 * Usado ao submeter resultados ou ao carregar partidas do backend.
 */
export interface MatchPlayerDto {
  /** ID do utilizador participante */
  userId: string;

  /** Nome do utilizador (opcional, usado apenas para exibição) */
  userName?: string;

  /** Pontuação do jogador (opcional, depende do tipo de jogo) */
  score?: number;

  /** Indica se este jogador é o vencedor */
  isWinner: boolean;

  /** Posição final do jogador (1 = primeiro, 2 = segundo, etc.) */
  rankPosition?: number;
}
