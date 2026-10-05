// src/features/games/catalog/services/recentSearchesService.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "meepleboard:recent-game-searches:v2";
const MAX_ITEMS = 8;
const MAX_TERM_LENGTH = 100;

export type RecentSearchEntry = {
  term: string;
  /** Capa do jogo mais relevante encontrado nessa pesquisa, se houver. */
  imageUrl?: string;
  /** Momento da última utilização desta pesquisa. */
  searchedAt: number;
};

function normalizeTerm(term: string): string {
  return term
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_TERM_LENGTH);
}

function normalizeForComparison(term: string): string {
  return normalizeTerm(term).toLocaleLowerCase();
}

function sanitizeImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function sanitizeEntry(value: unknown): RecentSearchEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<RecentSearchEntry>;

  if (typeof candidate.term !== "string") {
    return null;
  }

  const term = normalizeTerm(candidate.term);

  if (!term) {
    return null;
  }

  const searchedAt =
    typeof candidate.searchedAt === "number" &&
    Number.isFinite(candidate.searchedAt)
      ? candidate.searchedAt
      : 0;

  return {
    term,
    imageUrl: sanitizeImageUrl(candidate.imageUrl),
    searchedAt,
  };
}

function deduplicateEntries(
  entries: RecentSearchEntry[]
): RecentSearchEntry[] {
  const seen = new Set<string>();
  const result: RecentSearchEntry[] = [];

  for (const entry of entries) {
    const comparisonKey = normalizeForComparison(entry.term);

    if (!comparisonKey || seen.has(comparisonKey)) {
      continue;
    }

    seen.add(comparisonKey);
    result.push(entry);

    if (result.length >= MAX_ITEMS) {
      break;
    }
  }

  return result;
}

async function writeEntries(
  entries: RecentSearchEntry[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries)
    );
  } catch {
    // Não crítico.
  }
}

const recentSearchesService = {
  async getRecent(): Promise<RecentSearchEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return [];
      }

      const sanitized = parsed
        .map(sanitizeEntry)
        .filter(
          (entry): entry is RecentSearchEntry =>
            entry !== null
        );

      sanitized.sort(
        (a, b) => b.searchedAt - a.searchedAt
      );

      const normalized =
        deduplicateEntries(sanitized);

      if (normalized.length !== parsed.length) {
        await writeEntries(normalized);
      }

      return normalized;
    } catch {
      return [];
    }
  },

  async addRecent(
    term: string,
    imageUrl?: string
  ): Promise<RecentSearchEntry[]> {
    const normalizedTerm =
      normalizeTerm(term);

    if (!normalizedTerm) {
      return recentSearchesService.getRecent();
    }

    const current =
      await recentSearchesService.getRecent();

    const comparisonKey =
      normalizeForComparison(normalizedTerm);

    const existing =
      current.find(
        (entry) =>
          normalizeForComparison(entry.term) === comparisonKey
      );

    const updatedEntry: RecentSearchEntry = {
      term: normalizedTerm,
      imageUrl:
        sanitizeImageUrl(imageUrl) ??
        existing?.imageUrl,
      searchedAt: Date.now(),
    };

    const updated = [
      updatedEntry,
      ...current.filter(
        (entry) =>
          normalizeForComparison(entry.term) !== comparisonKey
      ),
    ].slice(0, MAX_ITEMS);

    await writeEntries(updated);

    return updated;
  },

  async removeRecent(
    term: string
  ): Promise<RecentSearchEntry[]> {
    const comparisonKey =
      normalizeForComparison(term);

    if (!comparisonKey) {
      return recentSearchesService.getRecent();
    }

    const current =
      await recentSearchesService.getRecent();

    const updated =
      current.filter(
        (entry) =>
          normalizeForComparison(entry.term) !== comparisonKey
      );

    await writeEntries(updated);

    return updated;
  },

  async clearRecent(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Não crítico.
    }
  },
};

export default recentSearchesService;