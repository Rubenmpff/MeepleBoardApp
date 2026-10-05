// src/features/games/types/GameSessionPlayer.ts

export type GameSessionInviteStatus = "Pending" | "Accepted" | "Declined";

/**
 * Representa um membro convidado/participante numa sessão.
 */
export interface GameSessionPlayer {
  userId: string;
  userName: string;

  isOrganizer: boolean;

  /**
   * Estado do convite.
   * Ideal: backend envia como string.
   * Blindado para compatibilidade caso venha enum number.
   */
  status: GameSessionInviteStatus | number;

  invitedAt?: string | null;
  respondedAt?: string | null;

  /**
   * Só faz sentido quando Accepted.
   * Pode não vir para Pending/Declined.
   */
  joinedAt?: string | null;

  leftAt?: string | null;
}

/**
 * Normaliza status vindo do backend (caso venha number).
 */
export function normalizeInviteStatus(
  status: GameSessionInviteStatus | number
): GameSessionInviteStatus {
  if (status === 0) return "Pending";
  if (status === 1) return "Accepted";
  if (status === 2) return "Declined";
  return status as GameSessionInviteStatus;
}

/**
 * Helpers profissionais para evitar lógica repetida no UI
 */
export const sessionPlayerGuards = {
  isAccepted: (p: GameSessionPlayer) =>
    normalizeInviteStatus(p.status) === "Accepted",

  isPending: (p: GameSessionPlayer) =>
    normalizeInviteStatus(p.status) === "Pending",

  isDeclined: (p: GameSessionPlayer) =>
    normalizeInviteStatus(p.status) === "Declined",
};