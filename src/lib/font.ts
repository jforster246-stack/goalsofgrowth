/** Font styles the user can switch between under settings. */

export type FontStyle = "traditional" | "modern";

export const FONTS: { id: FontStyle; label: string; blurb: string }[] = [
  {
    id: "traditional",
    label: "Traditional",
    blurb: "Script display, glyphic headings, serif text",
  },
  {
    id: "modern",
    label: "Modern",
    blurb: "Clean sans-serif throughout",
  },
];

const KEY = "gog-font";
const DEFAULT: FontStyle = "traditional";

export function getFont(): FontStyle {
  try {
    const f = localStorage.getItem(KEY) as FontStyle | null;
    return f === "modern" || f === "traditional" ? f : DEFAULT;
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
  } catch {
    /* no document (SSR) */
  }
}
