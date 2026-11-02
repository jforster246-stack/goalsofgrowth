/**
 * The Observatory's progress + "reveals" currency, kept in localStorage so it
 * needs no database migration (mirrors the Intentions / focus-timer pattern).
 *
 * How reveals work: every time you log a little time in A While Away you earn
 * one reveal; spending a reveal uncovers the next fact of a lesson. We never
 * store the currency directly — it's derived:
 *
 *   earned    = (your A While Away log count now) − (the count when you first
 *               opened the Observatory)          // only time logged from here on
 *   spent     = total facts you've revealed
 *   available = max(0, earned − spent)
 *
 * So we only persist a baseline log count and, per course, how many facts have
 * been revealed in sequence.
 */
import { useEffect, useSyncExternalStore } from "react";
import { getObservatoryProgress, saveObservatoryProgress } from "@/lib/curriculum.functions";

export type CurriculumStore = {
  /** A While Away log count captured the first time the Observatory was opened. */
  baseline: number | null;
  /** courseId → number of facts revealed in that course, in order. */
  revealed: Record<string, number>;
};

const KEY = "gog-curriculum";
const EVENT = "gog-curriculum-change";

const EMPTY: CurriculumStore = { baseline: null, revealed: {} };

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): CurriculumStore {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<CurriculumStore>;
    return {
      baseline: typeof parsed.baseline === "number" ? parsed.baseline : null,
      revealed: parsed.revealed && typeof parsed.revealed === "object" ? parsed.revealed : {},
    };
  } catch {
    return EMPTY;
  }
}

function write(store: CurriculumStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode — still apply for this session via the event */
  }
  notify();
}

/** Save to the account so progress survives cleared storage / other devices. */
function persist(store: CurriculumStore) {
  saveObservatoryProgress({ data: store }).catch(() => {
    /* offline — local copy is kept and re-synced next open */
  });
}

/**
 * Load the saved progress from the account and merge it with this device's
 * copy (never going backwards: keep the earliest baseline and the most facts
 * revealed per course), then save the merged result back.
 */
export function useCurriculumSync() {
  useEffect(() => {
    let cancelled = false;
    getObservatoryProgress()
      .then((remote) => {
        if (cancelled) return;
        const local = getCurriculum();
        const baselines = [remote?.baseline, local.baseline].filter(
          (b): b is number => typeof b === "number",
        );
        const revealed: Record<string, number> = { ...(remote?.revealed ?? {}) };
        for (const [k, v] of Object.entries(local.revealed)) {
          revealed[k] = Math.max(revealed[k] ?? 0, v);
        }
        const merged: CurriculumStore = {
          baseline: baselines.length ? Math.min(...baselines) : null,
          revealed,
        };
        try {
          localStorage.setItem(KEY, JSON.stringify(merged));
        } catch {
          /* ignore */
        }
        notify();
        persist(merged);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
}

function notify() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* no window (SSR) */
  }
}

export function getCurriculum(): CurriculumStore {
  return parse(readRaw());
}

// useSyncExternalStore needs a *stable* snapshot: return the same object
// reference while the stored string is unchanged, or it loops forever.
let snapRaw: string | null = null;
let snapValue: CurriculumStore = EMPTY;
let snapReady = false;

function getSnapshot(): CurriculumStore {
  const raw = readRaw();
  if (snapReady && raw === snapRaw) return snapValue;
  snapRaw = raw;
  snapValue = parse(raw);
  snapReady = true;
  return snapValue;
}

/** Record the starting A While Away log count, once, on first open. */
export function ensureBaseline(logCount: number) {
  const store = getCurriculum();
  if (store.baseline !== null) return;
  const next = { ...store, baseline: logCount };
  write(next);
  persist(next);
}

/** Reveal the next fact in a course (caller checks a reveal is available). */
export function revealNextFact(courseId: string) {
  const store = getCurriculum();
  const next = { ...store.revealed, [courseId]: (store.revealed[courseId] ?? 0) + 1 };
  const updated = { ...store, revealed: next };
  write(updated);
  persist(updated);
}

/** How many facts have been revealed across every course. */
export function totalRevealed(store: CurriculumStore): number {
  return Object.values(store.revealed).reduce((a, b) => a + b, 0);
}

export function revealedIn(store: CurriculumStore, courseId: string): number {
  return store.revealed[courseId] ?? 0;
}

/**
 * Reveals waiting to be spent, given the live A While Away log count. Before a
 * baseline is recorded we show 0 (nothing has been earned yet).
 */
export function availableReveals(store: CurriculumStore, logCount: number): number {
  if (store.baseline === null) return 0;
  const earned = Math.max(0, logCount - store.baseline);
  return Math.max(0, earned - totalRevealed(store));
}

/** Live curriculum store — re-renders when a fact is revealed or baseline set. */
export function useCurriculum(): CurriculumStore {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    getSnapshot,
    () => EMPTY,
  );
}
