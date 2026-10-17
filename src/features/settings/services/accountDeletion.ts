// What the device keeps about an account, removed when the account is deleted; and the «forgot password» detour
// from the deletion screen, so the password reset comes back to it (docs/proposta-eliminacao-conta.md, D8).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokenService } from "@/src/services/tokenService";
import { forgetAccountMemory } from "@/src/shared/hooks/useAccountMemory";

const RESUME_KEY = "meepleboard:account-deletion:resume";
const RESUME_FOR_MS = 60 * 60 * 1000;
// Device-wide keys that may hold the account's activity (older versions kept recent searches without an account).
const SHARED_KEYS = ["meepleboard:recent-game-searches:v2"];

/** Sign-in, preferences, recent searches and in-memory choices of this account; device-wide caches stay. */
export async function forgetAccountOnDevice(accountId: string | undefined): Promise<void> {
  await tokenService.clearAll();
  forgetAccountMemory();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const own = keys.filter(key => (accountId && key.startsWith(`meepleboard:${accountId}:`)) || SHARED_KEYS.includes(key) || key === RESUME_KEY);
    if (own.length) await AsyncStorage.multiRemove(own);
  } catch {
    // Storage errors never undo a deletion that already happened on the server.
  }
}

/** The deletion screen asked for a password reset: the reset brings the person back to it for an hour. */
export async function rememberDeletionResume(): Promise<void> {
  await AsyncStorage.setItem(RESUME_KEY, String(Date.now())).catch(() => {});
}

/** True once, within the hour after asking; the mark is removed either way. */
export async function takeDeletionResume(): Promise<boolean> {
  try {
    const at = Number(await AsyncStorage.getItem(RESUME_KEY));
    await AsyncStorage.removeItem(RESUME_KEY);
    return Number.isFinite(at) && at > 0 && Date.now() - at < RESUME_FOR_MS;
  } catch {
    return false;
  }
}
