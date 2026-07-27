// src/features/games/types/Campaign.ts

export type CampaignStatus = "Active" | "Completed" | "Abandoned";
export type CampaignMemberStatus = "Pending" | "Accepted" | "Declined" | "Removed" | "Left";

export interface CampaignMember {
  userId: string;
  userName: string;
  isCreator: boolean;
  status: CampaignMemberStatus;
  invitedAt: string;
  respondedAt?: string | null;
}

export interface JournalEntry {
  id: string;
  userId: string;
  userName: string;
  personalRating?: number | null;
  notes?: string | null;
  tags?: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface CampaignMatch {
  id: string;
  matchId: string;
  gameName?: string | null;
  matchDate: string;
  sessionNumber?: number | null;
  sessionTitle?: string | null;
  isSoloGame: boolean;
  durationInMinutes?: number | null;
  location?: string | null;
  journalEntries: JournalEntry[];
}

export interface Campaign {
  id: string;
  name: string;
  gameId: string;
  gameName?: string | null;
  gameImageUrl?: string | null;
  creatorId: string;
  creatorUserName?: string | null;
  status: CampaignStatus;
  notes?: string | null;
  memberCount: number;
  matchCount: number;
  averagePersonalRating?: number | null;
  createdAt: string;
  completedAt?: string | null;
  members: CampaignMember[];
  matches: CampaignMatch[];
}

/* ── Payloads ── */

export interface CreateCampaignPayload {
  name: string;
  gameId: string;
  notes?: string;
}

export interface UpsertJournalEntryPayload {
  personalRating?: number | null;
  notes?: string | null;
  tags?: string | null;
}

export interface AddMatchToCampaignPayload {
  matchId: string;
  sessionNumber?: number | null;
  sessionTitle?: string | null;
}

/* ── Helpers ── */

export function getStatusLabel(status: CampaignStatus): string {
  switch (status) {
    case "Active":    return "Ativa";
    case "Completed": return "Concluída";
    case "Abandoned": return "Abandonada";
  }
}

export function getStatusColor(status: CampaignStatus): string {
  switch (status) {
    case "Active":    return "#388E3C";
    case "Completed": return "#1E88E5";
    case "Abandoned": return "#999";
  }
}

export function getMemberStatusLabel(status: CampaignMemberStatus): string {
  switch (status) {
    case "Pending":  return "Pendente";
    case "Accepted": return "Membro";
    case "Declined": return "Recusou";
    case "Removed":  return "Removido";
    case "Left":     return "Saiu";
  }
}