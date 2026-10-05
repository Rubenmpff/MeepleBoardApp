// src/features/games/catalog/services/hotGamesCache.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Game } from "../types/Game";

const KEY = "meepleboard:hot-games:v2";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 horas
const MAX_ITEMS = 50;

type CacheEntry = {
  data: Game[];
  cachedAt: number;
};

function getGameKey(game: Game): string | null {
  if (game.bggId) {
    return `bgg-${game.bggId}`;
  }

  if (game.id) {
    return `id-${game.id}`;
  }

  return null;
}

function deduplicateGames(data: Game[]): Game[] {
  const unique = new Map<string, Game>();

  for (const game of data) {
    const key = getGameKey(game);

    if (!key) {
      continue;
    }

    unique.set(key, game);

    if (unique.size >= MAX_ITEMS) {
      break;
    }
  }

  return Array.from(unique.values());
}

function parseEntry(raw: string | null): CacheEntry | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;

    if (
      !Array.isArray(parsed.data) ||
      typeof parsed.cachedAt !== "number"
    ) {
      return null;
    }

    return {
      data: parsed.data as Game[],
      cachedAt: parsed.cachedAt,
    };
  } catch {
    return null;
  }
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.cachedAt > TTL_MS;
}

const hotGamesCache = {
  async get(): Promise<Game[] | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const entry = parseEntry(raw);

      if (!entry) {
        if (raw) {
          await AsyncStorage.removeItem(KEY);
        }

        return null;
      }

      if (isExpired(entry)) {
        await AsyncStorage.removeItem(KEY);
        return null;
      }

      return deduplicateGames(entry.data);
    } catch {
      return null;
    }
  },

  async set(data: Game[]): Promise<void> {
    try {
      const normalizedData = deduplicateGames(data);

      if (normalizedData.length === 0) {
        return;
      }

      const entry: CacheEntry = {
        data: normalizedData,
        cachedAt: Date.now(),
      };

      await AsyncStorage.setItem(
        KEY,
        JSON.stringify(entry)
      );
    } catch {
      // Não crítico.
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // Não crítico.
    }
  },
};

export default hotGamesCache;