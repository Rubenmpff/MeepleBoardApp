/**
 * Choices kept per account and per area, so nothing passes from one account to another.
 *   recall + useRemember — filters, search and tab: kept while the app is open (back from a detail keeps them);
 *                          forgotten when the account signs out (forgetAccountMemory). Screens keep their own useState.
 *   useAccountPreference — sort, view and resource language: kept on the device for that account.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";

const memory = new Map<string, unknown>();

export function useAccountId(): string {
  return useSelector((state: RootState) => state.auth.user?.id) ?? "signed-out";
}

/** Forget what was kept in memory for an account (on sign-out), or for every account. */
export function forgetAccountMemory(accountId?: string) {
  if (!accountId) { memory.clear(); return; }
  for (const key of [...memory.keys()]) if (key.startsWith(accountId + ":")) memory.delete(key);
}

/** The value kept for this account and area, or the fallback. Use it as a screen's useState initial value. */
export function recall<T>(account: string, area: string, fallback: T): T {
  const key = `${account}:${area}`;
  return memory.has(key) ? memory.get(key) as T : fallback;
}

/** Keep a screen's current value for this account and area (read back with recall). */
export function useRemember<T>(area: string, value: T) {
  const account = useAccountId();
  useEffect(() => { memory.set(`${account}:${area}`, value); }, [account, area, value]);
}

export const preferenceKey = (account: string, name: string) => `meepleboard:${account}:${name}`;

/** A preference saved on the device for the signed-in account; `accept` filters stored values. */
export function useAccountPreference<T extends string>(name: string, fallback: T, accept: (value: string) => boolean, legacyKey?: string) {
  const account = useAccountId();
  const [value, setValueState] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  const accountRef = useRef(account);
  accountRef.current = account;

  useEffect(() => {
    let active = true;
    setLoaded(false);
    (async () => {
      const key = preferenceKey(account, name);
      const saved = await AsyncStorage.getItem(key).catch(() => null);
      // A device-wide value from before preferences were per account is dropped, not given to whoever opens first.
      if (legacyKey) await AsyncStorage.removeItem(legacyKey).catch(() => {});
      if (active) { setValueState(saved != null && accept(saved) ? saved as T : fallback); setLoaded(true); }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, name]);

  const setValue = useCallback((next: T) => {
    setValueState(next);
    AsyncStorage.setItem(preferenceKey(accountRef.current, name), next).catch(() => {});
  }, [name]);

  return { value, setValue, loaded, account };
}

/** A value kept without re-rendering (e.g. a list's scroll position), saved when the screen unmounts. */
export function useRememberedRef<T>(area: string, initial: T) {
  const account = useAccountId();
  const key = `${account}:${area}`;
  const ref = useRef<T>(memory.has(key) ? memory.get(key) as T : initial);
  useEffect(() => () => { memory.set(key, ref.current); }, [key]);
  return ref;
}
