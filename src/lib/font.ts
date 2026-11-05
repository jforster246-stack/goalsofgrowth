/** Font styles the user can switch between under settings (independent of colour theme). */
import { useSyncExternalStore } from "react";

export type FontStyle = "traditional" | "modern" | "pixel" | "system";

export const FONTS: { id: FontStyle; label: string; blurb: string; sample: string }[] = [
  {
    id: "traditional",
    label: "Traditional",
    blurb: "Script display, glyphic headings, serif text",
    sample: "'Pinyon Script', cursive",
  },
  {
    id: "modern",
    label: "Modern",
    blurb: "Clean sans-serif throughout",
    sample: "Unbounded, Inter, ui-sans-serif, sans-serif",
  },
  {
    id: "pixel",
    label: "Pixel",
    blurb: "Retro pixel type throughout",
    sample: "VT323, ui-monospace, monospace",
  },
  {
    id: "system",
    label: "System",
    blurb: "Your phone's own font, like Notes",
    sample: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Inter, sans-serif",
  },
];

const KEY = "gog-font";
const DEFAULT: FontStyle = "modern";

export function isFontStyle(v: unknown): v is FontStyle {
  return FONTS.some((f) => f.id === v);
}

export function getFont(): FontStyle {
  try {
    const f = localStorage.getItem(KEY);
    return isFontStyle(f) ? f : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Persist the choice and apply it to <html> so every screen re-fonts live. */
export function setFont(id: FontStyle) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private mode — still apply for this session */
  }
  try {
    document.documentElement.setAttribute("data-font", id);
    window.dispatchEvent(new Event(FONT_EVENT));
  } catch {
    /* no document (SSR) */
  }
}

const FONT_EVENT = "gog-font-change";

/** Live font-style choice — re-renders when the user switches in settings. */
export function useFontStyle(): FontStyle {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(FONT_EVENT, cb);
      return () => window.removeEventListener(FONT_EVENT, cb);
    },
    getFont,
    () => DEFAULT,
  );
}
