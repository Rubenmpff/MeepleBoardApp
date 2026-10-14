import { GameSessionPlayer } from "./GameSessionPlayer";
import { MatchDto } from "../../matches/types/MatchForm";

export type GameSessionStatus = "Upcoming" | "Active" | "Closed" | "Cancelled";

export interface GameSession {
  id: string;
  name: string;

  organizerId: string;
  organizerUserName: string;

  scheduledStartDate?: string | null;

  /**
   * Data limite para os convidados responderem.
   * Se null, usa scheduledStartDate como limite.
   */
  responseDeadline?: string | null;

  /** Data efectiva de deadline (responseDeadline ?? scheduledStartDate) */
  effectiveDeadline?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  /** Hora a que termina sozinha: 24 h após a hora marcada, ou a escolhida pelo organizador. */
  autoCloseAt?: string | null;
  /** Limite para prolongar: 48 h após a hora marcada. */
  latestCloseAt?: string | null;
  closeTimeChosen?: boolean;
  closedAutomatically?: boolean;

  location?: string | null;

  /** Upcoming | Active | Closed | Cancelled */
  status: GameSessionStatus;

  /** Número de aceitações além do organizer */
  acceptedGuestCount?: number;

  players: GameSessionPlayer[];
  matches: MatchDto[];

  /** legado — não usar em código novo */
  isActive?: boolean;
  isCancelled?: boolean;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

export const gameSessionGuards = {
  isActive:    (s: GameSession) => s.status === "Active",
  isUpcoming:  (s: GameSession) => s.status === "Upcoming",
  isClosed:    (s: GameSession) => s.status === "Closed",
  isCancelled: (s: GameSession) => s.status === "Cancelled",
};
