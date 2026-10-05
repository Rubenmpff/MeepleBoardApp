// src/features/games/services/campaignService.ts

import api from "@/src/services/api";
import {
  Campaign,
  CreateCampaignPayload,
  UpsertJournalEntryPayload,
  AddMatchToCampaignPayload,
  JournalEntry,
} from "../types/Campaign";

const BASE = "/campaigns";

const campaignService = {
  /* ── Campanhas ── */

  async getMine(): Promise<Campaign[]> {
    const res = await api.get<Campaign[]>(`${BASE}/mine`);
    return res.data ?? [];
  },

  async getByGame(gameId: string): Promise<Campaign[]> {
    const res = await api.get<Campaign[]>(`${BASE}/game/${gameId}`);
    return res.data ?? [];
  },

  async getById(id: string): Promise<Campaign> {
    const res = await api.get<Campaign>(`${BASE}/${id}`);
    return res.data;
  },

  async create(payload: CreateCampaignPayload): Promise<Campaign> {
    const res = await api.post<Campaign>(BASE, payload);
    return res.data;
  },

  async update(id: string, payload: { name: string; notes?: string }): Promise<void> {
    await api.put(`${BASE}/${id}`, payload);
  },

  async complete(id: string): Promise<void> {
    await api.post(`${BASE}/${id}/complete`, null);
  },

  async abandon(id: string): Promise<void> {
    await api.post(`${BASE}/${id}/abandon`, null);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  /* ── Membros ── */

  async invite(campaignId: string, userId: string): Promise<void> {
    await api.post(`${BASE}/${campaignId}/members/invite`, { userId });
  },

  async respondInvite(campaignId: string, accept: boolean): Promise<void> {
    await api.post(`${BASE}/${campaignId}/members/respond`, accept);
  },

  async removeMember(campaignId: string, targetUserId: string): Promise<void> {
    await api.delete(`${BASE}/${campaignId}/members/${targetUserId}`);
  },

  async leave(campaignId: string): Promise<void> {
    await api.post(`${BASE}/${campaignId}/members/leave`, null);
  },

  /* ── Partidas ── */

  async addMatch(campaignId: string, payload: AddMatchToCampaignPayload): Promise<void> {
    await api.post(`${BASE}/${campaignId}/matches`, payload);
  },

  async removeMatch(campaignId: string, matchId: string): Promise<void> {
    await api.delete(`${BASE}/${campaignId}/matches/${matchId}`);
  },

  /* ── Diário ── */

  async upsertJournalEntry(
    matchId: string,
    payload: UpsertJournalEntryPayload
  ): Promise<JournalEntry> {
    const res = await api.put<JournalEntry>(`${BASE}/matches/${matchId}/journal`, payload);
    return res.data;
  },

  async getJournalEntries(matchId: string): Promise<JournalEntry[]> {
    const res = await api.get<JournalEntry[]>(`${BASE}/matches/${matchId}/journal`);
    return res.data ?? [];
  },
};

export default campaignService;