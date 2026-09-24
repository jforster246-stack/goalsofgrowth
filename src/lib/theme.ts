/** Colour themes the user can switch between under settings. */

export type ThemeId =
  | "natural"
  | "ice-cream"
  | "dark-magic"
  | "wild-berries"
  | "mono";

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
    swatches: ["#6f7c4e", "#d19a4a", "#a24b57", "#6a4b7a", "#b56b5e", "#5f8a7d"],
  },
  {
    id: "ice-cream",
    label: "Ice cream",
    blurb: "Soft strawberry, mint and toffee",
    swatches: ["#6aa07c", "#cf9a5a", "#cf7f92", "#9a7bb0", "#d76b86", "#7fbfc0"],
  },
  {
    id: "dark-magic",
    label: "Dark magic",
    blurb: "Deep forest, plum and crimson",
    swatches: ["#4e6b4a", "#6e4a59", "#8a2733", "#574266", "#7a5560", "#3f6660"],
  },
  {
    id: "wild-berries",
    label: "Wild berries",
    blurb: "Amethyst, copper and wine plum",
    swatches: ["#8c80b5", "#95805f", "#5c1f31", "#6f5b9c", "#a85f7a", "#5f6b9c"],
  },
  {
    id: "mono",
    label: "Black & white",
    blurb: "A simple monochrome palette",
    swatches: ["#4b4b4b", "#6f6f6f", "#262626", "#565656", "#7d7d7d", "#8f8f8f"],
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
