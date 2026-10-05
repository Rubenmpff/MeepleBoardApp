// src/features/library/utils/collectionHelpers.ts
import { UserGameLibrary, PlayedGame } from "../types/UserGameLibrary";
import { GameLibraryStatus } from "../types/GameLibraryStatus";

export interface CollectionEntry {
  gameId: string;
  gameName: string;
  gameImageUrl?: string;
  bggId?: number;
  averageRating?: number;
  averageWeight?: number;
  minPlayers?: number;
  maxPlayers?: number;
  isExpansion?: boolean;
  isCooperative?: boolean;
  supportsSoloMode?: boolean;
  status?: GameLibraryStatus;
  pricePaid?: number;
  timesPlayed: number;
  lastPlayedAt?: string;
  addedAt?: string;
  /** ID da entrada na biblioteca — só existe se o jogo ainda estiver lá (Tenho/Quero) */
  libraryEntryId?: string;
}

/**
 * Junta a biblioteca (Tenho/Quero) com os jogos "só jogados" (que já não
 * estão na biblioteca) numa única lista, sem duplicados — a fonte para o
 * separador "Todos" e para as contagens do cabeçalho.
 */
export function buildCollectionEntries(
  library: UserGameLibrary[],
  playedGames: PlayedGame[]
): CollectionEntry[] {
  const merged = new Map<string, CollectionEntry>();

  // 1º: os jogos "só jogados" — ficam como base
  for (const p of playedGames) {
    merged.set(p.gameId, {
      gameId: p.gameId,
      gameName: p.gameName,
      gameImageUrl: p.gameImageUrl,
      averageRating: p.averageRating,
      minPlayers: p.minPlayers,
      maxPlayers: p.maxPlayers,
      isExpansion: p.isExpansion,
      isCooperative: p.isCooperative,
      supportsSoloMode: p.supportsSoloMode,
      status: undefined,
      pricePaid: p.pricePaid,
      timesPlayed: p.timesPlayed,
      lastPlayedAt: p.lastPlayedAt,
      addedAt: undefined,
      libraryEntryId: undefined,
    });
  }

  // 2º: a biblioteca (Tenho/Quero) — tem SEMPRE prioridade sobre o "só jogado"
  // para o mesmo jogo, para nunca perder o estado real (bug já visto: um jogo
  // que estava em "Tenho" a aparecer como "Já jogado" por a fonte errada ganhar).
  for (const entry of library) {
    const played = merged.get(entry.gameId);
    merged.set(entry.gameId, {
      gameId: entry.gameId,
      gameName: entry.gameName,
      gameImageUrl: entry.gameImageUrl,
      bggId: entry.bggId,
      averageRating: entry.game?.averageRating,
      averageWeight: entry.game?.averageWeight,
      minPlayers: entry.game?.minPlayers,
      maxPlayers: entry.game?.maxPlayers,
      isExpansion: entry.game?.isExpansion,
      isCooperative: entry.game?.isCooperative,
      supportsSoloMode: entry.game?.supportsSoloMode,
      status: entry.status,
      pricePaid: entry.pricePaid,
      timesPlayed: entry.totalTimesPlayed ?? played?.timesPlayed ?? 0,
      lastPlayedAt: entry.lastPlayedAt ?? played?.lastPlayedAt,
      addedAt: entry.addedAt,
      libraryEntryId: entry.id,
    });
  }

  return Array.from(merged.values());
}

/** "há 9 dias", "hoje", "ontem" */
export function formatRelativeDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 30) return `há ${diffDays} dias`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
}

export function formatBggRating(rating?: number): string {
  if (rating == null || rating <= 0) return "Sem nota BGG";
  return rating.toFixed(1);
}

// ── Filtros ──────────────────────────────────────────────────────────────

export type HistoryFilter = "never" | "recent" | "stale";
export type TypeFilter = "cooperative" | "competitive" | "solo";

export interface CollectionFilters {
  playerCount?: number; // 1-4, ou 5 para "5+"
  minBggRating?: number; // 7, 8, 9
  types?: TypeFilter[];
  history?: HistoryFilter;
}

export const EMPTY_FILTERS: CollectionFilters = {};

export function countActiveFilters(filters: CollectionFilters): number {
  let count = 0;
  if (filters.playerCount != null) count++;
  if (filters.minBggRating != null) count++;
  if (filters.types && filters.types.length > 0) count++;
  if (filters.history != null) count++;
  return count;
}

export function applyFilters(entries: CollectionEntry[], filters: CollectionFilters): CollectionEntry[] {
  return entries.filter((e) => {
    if (filters.playerCount != null) {
      const min = e.minPlayers ?? 1;
      const max = e.maxPlayers ?? 99;
      const target = filters.playerCount;
      const matches = target === 5 ? max >= 5 : target >= min && target <= max;
      if (!matches) return false;
    }

    if (filters.minBggRating != null) {
      if (!e.averageRating || e.averageRating < filters.minBggRating) return false;
    }

    if (filters.types && filters.types.length > 0) {
      const gameTypes: TypeFilter[] = [];
      if (e.isCooperative) gameTypes.push("cooperative");
      if (e.supportsSoloMode) gameTypes.push("solo");
      if (!e.isCooperative) gameTypes.push("competitive");
      if (!filters.types.some((t) => gameTypes.includes(t))) return false;
    }

    if (filters.history) {
      const days = e.lastPlayedAt
        ? Math.floor((Date.now() - new Date(e.lastPlayedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      if (filters.history === "never" && e.timesPlayed > 0) return false;
      if (filters.history === "recent" && (days == null || days > 30)) return false;
      if (filters.history === "stale" && (days == null || days <= 180)) return false;
    }

    return true;
  });
}

// ── Ordenação ────────────────────────────────────────────────────────────

export type SortOption =
  | "recent_added" | "name_asc" | "bgg_rating" | "most_played" | "least_played"
  | "recently_played" | "stale_played" | "price_high" | "price_low";

export const SORT_LABELS: Record<SortOption, string> = {
  recent_added: "Adicionados recentemente",
  name_asc: "Nome A–Z",
  bgg_rating: "Nota BGG",
  most_played: "Mais jogados",
  least_played: "Menos jogados",
  recently_played: "Jogados recentemente",
  stale_played: "Não jogados há mais tempo",
  price_high: "Preço mais alto",
  price_low: "Preço mais baixo",
};

/** Opções de ordenação disponíveis, conforme o separador ativo. */
export function sortOptionsForTab(tab: "ALL" | GameLibraryStatus.Owned | GameLibraryStatus.Wishlist | "PLAYED"): SortOption[] {
  if (tab === GameLibraryStatus.Owned) {
    return ["recent_added", "name_asc", "bgg_rating", "most_played", "stale_played", "price_high", "price_low"];
  }
  if (tab === GameLibraryStatus.Wishlist) {
    return ["recent_added", "bgg_rating", "name_asc"];
  }
  if (tab === "PLAYED") {
    return ["recently_played", "most_played", "bgg_rating"];
  }
  return ["name_asc", "bgg_rating", "recent_added", "most_played"];
}

export function sortEntries(entries: CollectionEntry[], sort: SortOption): CollectionEntry[] {
  const arr = [...entries];
  const dateOrEpoch = (d?: string) => (d ? new Date(d).getTime() : 0);

  switch (sort) {
    case "recent_added":
      return arr.sort((a, b) => dateOrEpoch(b.addedAt) - dateOrEpoch(a.addedAt));
    case "name_asc":
      return arr.sort((a, b) => a.gameName.localeCompare(b.gameName));
    case "bgg_rating":
      return arr.sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1));
    case "most_played":
      return arr.sort((a, b) => b.timesPlayed - a.timesPlayed);
    case "least_played":
      return arr.sort((a, b) => a.timesPlayed - b.timesPlayed);
    case "recently_played":
      return arr.sort((a, b) => dateOrEpoch(b.lastPlayedAt) - dateOrEpoch(a.lastPlayedAt));
    case "stale_played":
      return arr.sort((a, b) => dateOrEpoch(a.lastPlayedAt) - dateOrEpoch(b.lastPlayedAt));
    case "price_high":
      return arr.sort((a, b) => (b.pricePaid ?? -1) - (a.pricePaid ?? -1));
    case "price_low":
      return arr.sort((a, b) => (a.pricePaid ?? Infinity) - (b.pricePaid ?? Infinity));
    default:
      return arr;
  }
}