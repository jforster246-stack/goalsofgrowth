import { CONSTELLATION_DATA } from "@/components/constellations-data";
import { STAR_PATH } from "@/components/goal-ui";
import { cn } from "@/lib/utils";

/**
 * The selectable icon set for goals, habits and hobbies: constellations drawn as
 * star-line asterisms (12 zodiac + well-known others). Kept under the original
 * `Motif` names so every consumer (picker, goal glyph, habit rows, stamps) works
 * unchanged. An unknown or missing id falls back to a six-pointed star.
 */
export type Motif = { id: string; label: string };

export const MOTIFS: Motif[] = CONSTELLATION_DATA.map((c) => ({
  id: c.id,
  label: c.name,
}));

const MOTIF_MAP = new Map(CONSTELLATION_DATA.map((c) => [c.id, c]));

/** Default habit icon by time of day. */
export const TIME_MOTIF = {
  morning: "ari",
  afternoon: "leo",
  evening: "ori",
} as const;

/** Renders a constellation by id; falls back to a six-pointed star. */
export function Motif({
  id,
  className,
}: {
  id?: string | null;
  className?: string;
}) {
  const c = id ? MOTIF_MAP.get(id) : undefined;
  if (!c) {
    return (
      <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
        <path d={STAR_PATH} fillRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(className)}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {c.lines.map(([a, b], i) => (
        <line
          key={`l${i}`}
          x1={c.stars[a]![0]}
          y1={c.stars[a]![1]}
          x2={c.stars[b]![0]}
          y2={c.stars[b]![1]}
          strokeOpacity="0.65"
        />
      ))}
      {c.stars.map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r="2.6" fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}
