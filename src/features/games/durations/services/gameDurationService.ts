import api from "@/src/services/api";
import { GameDurations } from "../types/GameDurations";

const gameDurationService = {
  /** Aggregates only: never match ids, names, dates or single community durations. */
  async get(gameId: string): Promise<GameDurations> {
    const res = await api.get<GameDurations>(`/game/${gameId}/durations`);
    return res.data;
  },
};

export default gameDurationService;
