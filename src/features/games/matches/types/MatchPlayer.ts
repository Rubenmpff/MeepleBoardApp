// src/features/games/types/MatchPlayer.ts

/**
 * Representa um jogador dentro de uma partida.
 * - No FE podes enviar só userId/isWinner/score/rankPosition
 * - Do BE pode vir também id/matchId
 */
export interface MatchPlayerDto {
  /** (Opcional) ID do registo MatchPlayer (se o backend devolver) */
  id?: string;

  /** (Opcional) MatchId (se o backend devolver) */
  matchId?: string;

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