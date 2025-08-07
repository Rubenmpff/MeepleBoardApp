import { GameSessionPlayer } from "./GameSessionPlayer";
import { MatchDto } from "./MatchForm";

/**
 * Representa uma sessão de jogo.
 */
export interface GameSession {
  /** ID único da sessão */
  id: string;

  /** Nome da sessão (ex: "Noite de Jogos no João") */
  name: string;

  /** Nome do organizador (pode vir diretamente do backend) */
  organizer: string;

  /** Local onde a sessão ocorre (opcional) */
  location?: string | null;

  /** Data/hora de início */
  startDate: string;

  /** Data/hora de fim (se a sessão já foi encerrada) */
  endDate?: string | null;

  /** Jogadores participantes */
  players: GameSessionPlayer[];

  /** Indica se a sessão está ativa */
  isActive: boolean;

  /** Partidas associadas à sessão */
  matches: MatchDto[];
}
