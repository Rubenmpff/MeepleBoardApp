

import { useEffect, useState } from "react";
import gameService from "../services/gameService";
import hotGamesCache from "../services/hotGamesCache";
import type { Game } from "../types/Game";

export function useHotGames() {
  const [hotGames, setHotGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadHotGames = async () => {
      let hadCachedData = false;

      try {
        const cached = await hotGamesCache.get();

        if (!mounted) {
          return;
        }

        if (cached && cached.length > 0) {
          hadCachedData = true;
          setHotGames(cached);
        }

        /*
         * Mesmo quando existe cache, fazemos revalidação em background.
         *
         * Assim:
         * - a UI abre instantaneamente com os dados guardados;
         * - a lista continua atualizada;
         * - o utilizador não fica preso 24h a uma hot list antiga.
         *
         * Só mostramos loading visual quando ainda não existe nada para mostrar.
         */
        if (!hadCachedData) {
          setLoading(true);
        }

        const fresh = await gameService.getHotGames({
          signal: controller.signal,
        });

        if (!mounted || controller.signal.aborted) {
          return;
        }

        const next =
          Array.isArray(fresh)
            ? fresh
            : [];

        if (next.length > 0) {
          setHotGames(next);
          await hotGamesCache.set(next);
        } else if (!hadCachedData) {
          /*
           * Se não havia cache e a API devolveu vazio,
           * deixamos explicitamente a lista vazia.
           *
           * Não guardamos respostas vazias em cache.
           */
          setHotGames([]);
        }
      } catch (error: any) {
        const cancelled =
          controller.signal.aborted ||
          error?.name === "AbortError" ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED" ||
          error?.message === "canceled" ||
          error?.__CANCEL__ === true;

        if (
          !cancelled &&
          __DEV__
        ) {
          console.error(
            "❌ Erro ao carregar Hot Games do BGG:",
            error
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadHotGames();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return {
    hotGames,
    loading,
  } as const;
}
