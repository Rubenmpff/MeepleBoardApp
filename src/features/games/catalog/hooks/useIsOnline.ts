// src/features/games/catalog/hooks/useIsOnline.ts

import { useEffect, useState } from "react";
import NetInfo, {
  type NetInfoState,
} from "@react-native-community/netinfo";

function resolveIsOnline(state: NetInfoState): boolean {
  /*
   * isConnected diz-nos se existe ligação a uma rede.
   *
   * isInternetReachable pode ser:
   * - true  -> internet confirmada;
   * - false -> existe rede, mas sem acesso real à internet;
   * - null  -> ainda não foi possível confirmar.
   *
   * Quando ainda está null, consideramos online se a ligação de rede
   * estiver ativa. Isto evita marcar o utilizador como offline durante
   * os primeiros instantes enquanto o NetInfo confirma reachability.
   */
  return (
    state.isConnected === true &&
    state.isInternetReachable !== false
  );
}

export function useIsOnline() {
  const [isOnline, setIsOnline] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    /*
     * Lê imediatamente o estado atual.
     * Assim não dependemos apenas do primeiro evento do listener.
     */
    void NetInfo.fetch().then((state) => {
      if (!mounted) {
        return;
      }

      setIsOnline(
        resolveIsOnline(state)
      );
    });

    const unsubscribe =
      NetInfo.addEventListener(
        (state) => {
          if (!mounted) {
            return;
          }

          setIsOnline(
            resolveIsOnline(state)
          );
        }
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return isOnline;
}