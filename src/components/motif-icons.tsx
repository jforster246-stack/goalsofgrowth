import { cn } from "@/lib/utils";

/**
 * Bold, solid folk-art motifs used as selectable icons for goals and habits.
 * Each is a single 24x24 path filled with currentColor (fill-rule evenodd so
 * carved holes work). This is a starter set in the house style; the full
 * purchased pack can be dropped in here later by adding more entries.
 */
export type Motif = { id: string; label: string; path: string };

export const MOTIFS: Motif[] = [
  {
    id: "sun",
    label: "Sun",
    path: "M12 1 14.87 5.07 19.78 4.22 18.93 9.13 23 12 18.93 14.87 19.78 19.78 14.87 18.93 12 23 9.13 18.93 4.22 19.78 5.07 14.87 1 12 5.07 9.13 4.22 4.22 9.13 5.07Z M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z",
  },
  {
    id: "moon",
    label: "Moon",
    path: "M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Z M15.8 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z",
  },
  {
    id: "tree",
    label: "Tree",
    path: "M12 1.5 18 10.5 13.6 10.5 20 19 4 19 10.4 10.5 6 10.5Z M10.3 18.5h3.4V22.5h-3.4Z",
  },
  {
    id: "heart",
    label: "Heart",
    path: "M12 21.5C2.8 14.4 3.2 7.4 7.7 5.3 10.2 4.1 12 6.2 12 7.8 12 6.2 13.8 4.1 16.3 5.3 20.8 7.4 21.2 14.4 12 21.5Z",
  },
  {
    id: "leaf",
    label: "Leaf",
    path: "M4 20.5C3 8.5 11.5 2.5 20.5 3.5 21.5 15.5 13 21.5 4 20.5Z M8 16.5C11 11.5 15 8.5 18 7",
  },
  {
    id: "tulip",
    label: "Tulip",
    path: "M6.4 10C4.9 4 9 2.6 12 6.8 15 2.6 19.1 4 17.6 10 17.6 13 6.4 13 6.4 10Z M11 12h2v9.5h-2Z",
  },
  {
    id: "flower",
    label: "Flower",
    path: "M8.5 6.8a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0Z M13.45 10.39a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0Z M11.56 16.21a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0Z M5.44 16.21a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0Z M3.55 10.39a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0Z M9.9 12a2.1 2.1 0 1 0 4.2 0 2.1 2.1 0 1 0-4.2 0Z",
  },
  {
    id: "sprout",
    label: "Sprout",
    path: "M11.3 12h1.4V22h-1.4Z M12 12.5C8 12.5 5.5 9.5 5.5 5.3 9.7 5.3 12 8.3 12 12.5Z M12 14.5C16 14.5 18.5 11.5 18.5 7.3 14.3 7.3 12 10.3 12 14.5Z",
  },
  {
    id: "clover",
    label: "Clover",
    path: "M11.4 13h1.2v8h-1.2Z M12 3.5a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z M7.6 10a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z M16.4 10a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z",
  },
  {
    id: "berry",
    label: "Berry",
    path: "M12 6.6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M15.9 8.9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M15.9 13.4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M12 15.7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M8.1 13.4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M8.1 8.9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M12 11.1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
  },
  {
    id: "mushroom",
    label: "Mushroom",
    path: "M3.5 12.5C3.5 6.7 7.3 3 12 3 16.7 3 20.5 6.7 20.5 12.5 20.5 13.7 3.5 13.7 3.5 12.5Z M10 13h4v7c0 1.2-4 1.2-4 0Z",
  },
  {
    id: "wave",
    label: "Wave",
    path: "M3 15.5C6 9.5 10 9.5 12 14 14 18.5 18 18.5 21 12.5V19C15.5 22 8.5 22 3 19Z",
  },
  {
    id: "sixpoint",
    label: "Star",
    path: "M12 0.5 14.1 8.36 21.96 6.25 16.2 12 21.96 17.75 14.1 15.64 12 23.5 9.9 15.64 2.04 17.75 7.8 12 2.04 6.25 9.9 8.36Z M12 9.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z",
  },
  {
    id: "sparkle",
    label: "Sparkle",
    path: "M12 2.5c.55 4.35 3.1 6.9 7.5 7.5-4.4.6-6.95 3.15-7.5 7.5-.55-4.35-3.1-6.9-7.5-7.5 4.4-.6 6.95-3.15 7.5-7.5Z",
  },
  {
    id: "spade",
    label: "Spade",
    path: "M12 2.5C12 2.5 3.5 9 3.5 14.2 3.5 17 5.6 18.7 8 18.7 9.4 18.7 10.6 18.1 11.3 17.1 11 19 10.2 20.5 9 21.5H15C13.8 20.5 13 19 12.7 17.1 13.4 18.1 14.6 18.7 16 18.7 18.4 18.7 20.5 17 20.5 14.2 20.5 9 12 2.5 12 2.5Z",
  },
  {
    id: "sunburst",
    label: "Burst",
    path: "M12 2 13.3 8.2 17.5 3.4 15.9 9.5 21.6 6.9 17.3 11.4 23.5 11 18.4 14.3 24 16.3 17.8 16.7 21.6 21.7 15.9 18.9 17.8 24.7 14.3 19.6 13.4 25.6 12 22 10.6 25.6 9.7 19.6 6.2 24.7 8.1 18.9 2.4 21.7 6.2 16.7 0 16.3 5.6 14.3 0.5 11 6.7 11.4 2.4 6.9 8.1 9.5 6.5 3.4 10.7 8.2Z",
  },
];

export const MOTIF_MAP: Record<string, string> = Object.fromEntries(
  MOTIFS.map((m) => [m.id, m.path]),
);

/** Default habit icon by time of day. */
export const TIME_MOTIF = {
  morning: "sun",
  afternoon: "tree",
  evening: "moon",
} as const;

/** Renders a motif by id; returns null if the id is unknown. */
export function Motif({
  id,
  className,
}: {
  id?: string | null;
  className?: string;
}) {
  const path = id ? MOTIF_MAP[id] : undefined;
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
      <path d={path} fillRule="evenodd" />
    </svg>
  );
}
