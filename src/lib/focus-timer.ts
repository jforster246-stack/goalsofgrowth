/** Focus timer on/off switch from Settings — hides every timer button app-wide. */
import { useSyncExternalStore } from "react";

const KEY = "gog-focus-timer";
const FOCUS_EVENT = "gog-focus-timer-change";

export function getFocusTimerEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setFocusTimerEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    /* private mode — still apply for this session */
  }
  try {
    window.dispatchEvent(new Event(FOCUS_EVENT));
  } catch {
    /* no document (SSR) */
  }
}

/** Live setting — re-renders when the user toggles it in settings. */
export function useFocusTimerEnabled(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(FOCUS_EVENT, cb);
      return () => window.removeEventListener(FOCUS_EVENT, cb);
    },
    getFocusTimerEnabled,
    () => true,
  );
}
