
//
// Cache persistente dos resultados de pesquisa.
//
// Objetivos:
// - resposta instantânea para pesquisas já feitas;
// - funcionamento útil em modo offline;
// - stale-while-revalidate no hook de pesquisa;
// - TTL para evitar dados demasiado antigos;
// - limite global de pesquisas guardadas;
// - limpeza automática de entradas expiradas/corrompidas;
// - deduplicação de jogos;
// - chaves de pesquisa normalizadas;
// - LRU aproximado através de lastAccessedAt.

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Game } from "../types/Game";

const PREFIX = "meepleboard:game-search:v2:";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const MAX_ENTRIES = 40;

// Proteção adicional para não guardar listas enormes por pesquisa.
// O frontend pagina de 10 em 10, mas o utilizador pode continuar a carregar.
// 100 resultados por termo é mais do que suficiente para cache local.
const MAX_GAMES_PER_ENTRY = 100;

type CacheEntry = {
  data: Game[];
  cachedAt: number;
  lastAccessedAt: number;
};

function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getStorageKey(query: string): string | null {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return null;
  }

  return `${PREFIX}${normalized}`;
}

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

    /*
     * Se o mesmo jogo aparecer mais de uma vez, mantemos a versão mais recente
     * recebida no array. Normalmente é a versão mais enriquecida.
     */
    unique.set(key, game);
  }

  return Array.from(unique.values())
    .slice(0, MAX_GAMES_PER_ENTRY);
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
      lastAccessedAt:
        typeof parsed.lastAccessedAt === "number"
          ? parsed.lastAccessedAt
          : parsed.cachedAt,
    };
  } catch {
    return null;
  }
}

function isExpired(entry: CacheEntry, now = Date.now()): boolean {
  return now - entry.cachedAt > TTL_MS;
}

async function enforceCacheLimits(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) =>
      key.startsWith(PREFIX)
    );

    if (cacheKeys.length === 0) {
      return;
    }

    const now = Date.now();
    const pairs =
      await AsyncStorage.multiGet(cacheKeys);

    const validEntries: {
      key: string;
      lastAccessedAt: number;
    }[] = [];

    const keysToRemove: string[] = [];

    for (const [key, raw] of pairs) {
      const entry = parseEntry(raw);

      if (!entry || isExpired(entry, now)) {
        keysToRemove.push(key);
        continue;
      }

      validEntries.push({
        key,
        lastAccessedAt:
          entry.lastAccessedAt,
      });
    }

    /*
     * Primeiro removemos expirados/corrompidos.
     */
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(
        keysToRemove
      );
    }

    /*
     * Depois aplicamos o limite LRU.
     */
    if (
      validEntries.length >
      MAX_ENTRIES
    ) {
      validEntries.sort(
        (a, b) =>
          a.lastAccessedAt -
          b.lastAccessedAt
      );

      const overflow =
        validEntries
          .slice(
            0,
            validEntries.length -
              MAX_ENTRIES
          )
          .map((entry) => entry.key);

      if (overflow.length > 0) {
        await AsyncStorage.multiRemove(
          overflow
        );
      }
    }
  } catch {
    /*
     * Cache é uma otimização.
     * Nunca deve bloquear a pesquisa principal.
     */
  }
}

const searchResultsCache = {
  async get(
    query: string
  ): Promise<Game[] | null> {
    const storageKey =
      getStorageKey(query);

    if (!storageKey) {
      return null;
    }

    try {
      const raw =
        await AsyncStorage.getItem(
          storageKey
        );

      const entry = parseEntry(raw);

      if (!entry) {
        if (raw) {
          await AsyncStorage.removeItem(
            storageKey
          );
        }

        return null;
      }

      if (isExpired(entry)) {
        await AsyncStorage.removeItem(
          storageKey
        );

        return null;
      }

      const data =
        deduplicateGames(entry.data);

      /*
       * Atualiza a recência de acesso para LRU.
       * Não altera cachedAt: o TTL continua a contar desde a última escrita
       * de dados frescos, não desde a última leitura.
       */
      const refreshedEntry: CacheEntry = {
        data,
        cachedAt: entry.cachedAt,
        lastAccessedAt: Date.now(),
      };

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(
          refreshedEntry
        )
      );

      return data;
    } catch {
      return null;
    }
  },

  async set(
    query: string,
    data: Game[]
  ): Promise<void> {
    const storageKey =
      getStorageKey(query);

    if (!storageKey) {
      return;
    }

    try {
      const now = Date.now();

      const entry: CacheEntry = {
        data: deduplicateGames(data),
        cachedAt: now,
        lastAccessedAt: now,
      };

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(entry)
      );

      /*
       * A manutenção pode correr depois da escrita principal.
       * Não é preciso bloquear a UI à espera desta limpeza.
       */
      void enforceCacheLimits();
    } catch {
      /*
       * Não crítico:
       * a pesquisa continua a funcionar sem cache.
       */
    }
  },

  /**
   * Junta os jogos de todas as pesquisas ainda válidas.
   *
   * Usado pelo GameSearchScreen para criar um pool local instantâneo/offline.
   * Durante esta leitura também removemos entradas expiradas ou corrompidas.
   */
  async getAllCachedGames(): Promise<
    Game[]
  > {
    try {
      const keys =
        await AsyncStorage.getAllKeys();

      const cacheKeys =
        keys.filter((key) =>
          key.startsWith(PREFIX)
        );

      if (cacheKeys.length === 0) {
        return [];
      }

      const pairs =
        await AsyncStorage.multiGet(
          cacheKeys
        );

      const now = Date.now();

      const seen =
        new Map<string, Game>();

      const keysToRemove: string[] = [];

      for (const [key, raw] of pairs) {
        const entry =
          parseEntry(raw);

        if (
          !entry ||
          isExpired(entry, now)
        ) {
          keysToRemove.push(key);
          continue;
        }

        for (
          const game of
          deduplicateGames(entry.data)
        ) {
          const gameKey =
            getGameKey(game);

          if (!gameKey) {
            continue;
          }

          /*
           * Se o jogo já apareceu noutra pesquisa, mantemos a primeira versão.
           * Para o pool local isto é suficiente e evita duplicados.
           */
          if (!seen.has(gameKey)) {
            seen.set(gameKey, game);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(
          keysToRemove
        );
      }

      return Array.from(
        seen.values()
      );
    } catch {
      return [];
    }
  },

  /**
   * Limpa apenas a cache de pesquisa.
   * Útil para logout, debug ou futuras definições da aplicação.
   */
  async clear(): Promise<void> {
    try {
      const keys =
        await AsyncStorage.getAllKeys();

      const cacheKeys =
        keys.filter((key) =>
          key.startsWith(PREFIX)
        );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(
          cacheKeys
        );
      }
    } catch {
      // Não crítico.
    }
  },
};

export default searchResultsCache;