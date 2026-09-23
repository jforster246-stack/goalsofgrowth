/** Colour themes the user can switch between under settings. */

export type ThemeId = "natural" | "ice-cream" | "dark-magic";

export const THEMES: {
  id: ThemeId;
  label: string;
  blurb: string;
  /** Representative swatches shown in the picker (surface, two accents, bg). */
  swatches: string[];
}[] = [
  {
    id: "natural",
    label: "Natural",
    blurb: "Warm autumn earth tones",
    swatches: ["#3b4a30", "#d19a4a", "#a24b57", "#f4eee1"],
  },
  {
    id: "ice-cream",
    label: "Ice cream",
    blurb: "Soft strawberry, mint and toffee",
    swatches: ["#6e4326", "#cf7f92", "#6aa07c", "#fff7ec"],
  },
  {
    id: "dark-magic",
    label: "Dark magic",
    blurb: "Deep forest, plum and crimson",
    swatches: ["#24361f", "#8a2733", "#6e4a59", "#dde1d6"],
  },
];

const KEY = "gog-theme";
const DEFAULT: ThemeId = "natural";

export function getTheme(): ThemeId {
  try {
    const t = localStorage.getItem(KEY) as ThemeId | null;
    return t && THEMES.some((x) => x.id === t) ? t : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Persist the choice and apply it to <html> so every screen re-skins live. */
export function setTheme(id: ThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private mode — still apply for this session */
  }
  try {
    document.documentElement.setAttribute("data-theme", id);
  } catch {
    /* no document (SSR) */
  }
}
