import { GameSessionPlayer } from "./GameSessionPlayer";
import { MatchDto } from "./MatchForm";

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

/** Devolve a label human-friendly do status */
export function getStatusLabel(status: GameSessionStatus): string {
  switch (status) {
    case "Upcoming":   return "Agendada";
    case "Active":     return "Ativa";
    case "Closed":     return "Encerrada";
    case "Cancelled":  return "Cancelada";
  }
}

/** Devolve a cor do status */
export function getStatusColor(status: GameSessionStatus): string {
  switch (status) {
    case "Upcoming":   return "#f39c12";
    case "Active":     return "#388E3C";
    case "Closed":     return "#999";
    case "Cancelled":  return "#D32F2F";
  }
}