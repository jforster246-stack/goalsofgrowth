/**
 * Intentions — pick how you're feeling (or the feeling you want to shift into)
 * and carry a matching mantra for the day. The chosen intention is kept in
 * localStorage, keyed to the calendar day, so it persists across reloads and
 * quietly resets each morning. Mirrors the focus-timer live-store pattern.
 */
import { useSyncExternalStore } from "react";

export type MoodAccent =
  | "sky"
  | "plum"
  | "gold"
  | "rose"
  | "sage"
  | "star"
  | "clay"
  | "olive";

export type MoodIcon =
  | "waves"
  | "moon"
  | "sunrise"
  | "palette"
  | "anchor"
  | "feather"
  | "hourglass"
  | "sprout";

export type Mood = {
  /** Stable key used for storage and icon lookup. */
  id: string;
  /** The feeling, as shown on the card. */
  name: string;
  /** A soft two-or-three word cue under the name. */
  cue: string;
  accent: MoodAccent;
  icon: MoodIcon;
  mantras: readonly string[];
};

export const MOODS: readonly Mood[] = [
  {
    id: "anxious",
    name: "Anxious & overthinking",
    cue: "Come back to now",
    accent: "sky",
    icon: "waves",
    mantras: [
      "I don't need to solve a problem that isn't happening right now.",
      "I can let a thought pass without following it.",
      "Not everything that feels urgent requires my attention.",
      "I am allowed to be uncertain and still feel safe.",
      "I return to what is real, right here, right now.",
    ],
  },
  {
    id: "sad",
    name: "Sad & low energy",
    cue: "Be gentle today",
    accent: "plum",
    icon: "moon",
    mantras: [
      "I don't have to feel good to take good care of myself.",
      "This is a feeling, not my forever.",
      "I can meet myself where I am today.",
      "Rest is part of my rhythm, not a failure of it.",
      "I can let today be gentle.",
    ],
  },
  {
    id: "motivated",
    name: "Motivated & ready",
    cue: "Begin and build",
    accent: "gold",
    icon: "sunrise",
    mantras: [
      "Small steps are still movement.",
      "I build trust in myself by showing up.",
      "Done and imperfect is better than imagined and unfinished.",
      "I can do hard things without making them harder than they are.",
      "I don't need permission to begin.",
    ],
  },
  {
    id: "creative",
    name: "Creative & inspired",
    cue: "Follow the curiosity",
    accent: "rose",
    icon: "palette",
    mantras: [
      "I make the things I wish existed.",
      "Curiosity is enough of a reason to begin.",
      "There is no single right way to make something.",
      "I am allowed to experiment without needing a result.",
      "I find ideas by paying attention.",
    ],
  },
  {
    id: "insecure",
    name: "Insecure & comparing",
    cue: "Stay on your path",
    accent: "sage",
    icon: "anchor",
    mantras: [
      "Someone else's path does not diminish mine.",
      "I can admire something without needing to become it.",
      "I am allowed to be a work in progress.",
      "My worth is not something I have to earn today.",
      "I trust myself to find my own way.",
    ],
  },
  {
    id: "overwhelmed",
    name: "Overwhelmed & scattered",
    cue: "Just the next thing",
    accent: "star",
    icon: "feather",
    mantras: [
      "I only need to do the next thing.",
      "Everything doesn't need my attention at once.",
      "I can make my life simpler.",
      "I choose rhythm over pressure.",
      "I am allowed to leave things for another day.",
    ],
  },
  {
    id: "impatient",
    name: "Impatient & frustrated",
    cue: "Let it take its time",
    accent: "clay",
    icon: "hourglass",
    mantras: [
      "I can let things take the time they take.",
      "Progress doesn't need to be visible to be real.",
      "I don't need to rush to prove that I'm moving.",
      "I can respond instead of react.",
      "I am building a life, not racing towards one.",
    ],
  },
  {
    id: "grounded",
    name: "Grounded & content",
    cue: "Enjoy what's here",
    accent: "olive",
    icon: "sprout",
    mantras: [
      "There is a life happening here, not just a life I'm working towards.",
      "I notice the small things that make a life feel like mine.",
      "I am allowed to enjoy what I've already built.",
      "Ordinary moments are part of the point.",
      "I can be here without needing to be elsewhere.",
    ],
  },
];

export function moodById(id: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}

/** A random mantra from the mood, avoiding `exclude` when another option exists. */
export function pickMantra(mood: Mood, exclude?: string): string {
  const pool = mood.mantras.filter((m) => m !== exclude);
  const from = pool.length > 0 ? pool : mood.mantras;
  return from[Math.floor(Math.random() * from.length)] ?? mood.mantras[0]!;
}

/** Today as a local YYYY-MM-DD key, matching the rest of the app. */
function todayKey(): string {
  return new Date().toLocaleDateString("en-CA");
}

export type Intention = { moodId: string; mantra: string };

const KEY = "gog-intention";
const EVENT = "gog-intention-change";

type Stored = Intention & { date: string };

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Intention | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Stored;
    if (parsed.date !== todayKey() || !moodById(parsed.moodId)) return null;
    return { moodId: parsed.moodId, mantra: parsed.mantra };
  } catch {
    return null;
  }
}

/** The intention carried for today, or null if none is set for the current day. */
export function getTodayIntention(): Intention | null {
  return parse(readRaw());
}

// useSyncExternalStore needs a *stable* snapshot: return the same object
// reference while the stored value is unchanged, or it loops forever.
let snapRaw: string | null = null;
let snapValue: Intention | null = null;
let snapReady = false;

function getSnapshot(): Intention | null {
  const raw = readRaw();
  if (snapReady && raw === snapRaw) return snapValue;
  snapRaw = raw;
  snapValue = parse(raw);
  snapReady = true;
  return snapValue;
}

export function setTodayIntention(moodId: string, mantra: string) {
  try {
    const value: Stored = { moodId, mantra, date: todayKey() };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* private mode — still apply for this session */
  }
  notify();
}

export function clearTodayIntention() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  notify();
}

function notify() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* no window (SSR) */
  }
}

/** Live today's intention — re-renders when it's set, changed or cleared. */
export function useTodayIntention(): Intention | null {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    getSnapshot,
    () => null,
  );
}
