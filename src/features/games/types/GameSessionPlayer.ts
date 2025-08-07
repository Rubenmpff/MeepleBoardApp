/**
 * Representa um jogador numa sessão de jogo.
 */
export interface GameSessionPlayer {
  /** ID do utilizador */
  userId: string;

  /** Nome do utilizador */
  userName: string;

  /** Indica se este jogador é o organizador da sessão */
  isOrganizer: boolean;

  /** Data/hora de entrada na sessão */
  joinedAt: string;

  /** Data/hora de saída (se aplicável) */
  leftAt?: string | null;
}
