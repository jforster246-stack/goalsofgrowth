import { cn } from "@/lib/utils";

/**
 * The selectable icon set for goals, habits and hobbies: original mystical /
 * tarot-flavoured symbols (moons, suns, stars, crystals, an eye, and more),
 * drawn in currentColor. Kept under the original `Motif` names so every consumer
 * (picker, goal glyph, habit rows, hobby icons, stamps) works unchanged; an
 * unknown or missing id falls back to a star.
 */
export type Motif = { id: string; label: string };

export const MOTIFS: Motif[] = [
  { id: "moon", label: "Moon" },
  { id: "star", label: "Star" },
  { id: "sparkle", label: "Sparkle" },
  { id: "sun", label: "Sun" },
  { id: "sunface", label: "Sun face" },
  { id: "phases", label: "Moon phases" },
  { id: "pentacle", label: "Pentacle" },
  { id: "crystal", label: "Crystal" },
  { id: "cluster", label: "Crystals" },
  { id: "eye", label: "Eye" },
  { id: "flame", label: "Flame" },
  { id: "leaf", label: "Leaf" },
  { id: "mountain", label: "Mountain" },
  { id: "wave", label: "Wave" },
  { id: "bolt", label: "Lightning" },
  { id: "heart", label: "Heart" },
  { id: "key", label: "Key" },
  { id: "droplet", label: "Droplet" },
  { id: "comet", label: "Comet" },
  { id: "spiral", label: "Spiral" },
  { id: "feather", label: "Feather" },
  { id: "snake", label: "Snake" },
];

/** Default habit icon by time of day. */
export const TIME_MOTIF = {
  morning: "sun",
  afternoon: "star",
  evening: "moon",
} as const;

function rays(count: number, r0: number, r1: number, w: number) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    out.push(
      <line
        key={i}
        x1={50 + Math.cos(a) * r0}
        y1={50 + Math.sin(a) * r0}
        x2={50 + Math.cos(a) * r1}
        y2={50 + Math.sin(a) * r1}
        fill="none"
        strokeWidth={w}
      />,
    );
  }
  return out;
}

function renderSymbol(id: string) {
  switch (id) {
    case "moon":
      return <path d="M64 14 A38 38 0 1 0 64 86 A30 30 0 1 1 64 14 Z" />;
    case "star":
      return (
        <path d="M50 14 L60 40 L88 42 L66 59 L74 86 L50 70 L26 86 L34 59 L12 42 L40 40 Z" />
      );
    case "sparkle":
      return (
        <path d="M50 8 C53 42 58 47 92 50 C58 53 53 58 50 92 C47 58 42 53 8 50 C42 47 47 42 50 8 Z" />
      );
    case "sun":
      return (
        <g>
          <g>{rays(12, 24, 34, 6)}</g>
          <circle cx="50" cy="50" r="16" />
        </g>
      );
    case "sunface":
      return (
        <g>
          <g>{rays(8, 28, 38, 5)}</g>
          <circle cx="50" cy="50" r="18" fill="none" strokeWidth="5" />
          <circle cx="43" cy="46" r="2.6" />
          <circle cx="57" cy="46" r="2.6" />
          <path d="M42 56 Q50 62 58 56" fill="none" strokeWidth="4" />
        </g>
      );
    case "phases":
      return (
        <g>
          <circle cx="22" cy="50" r="11" fill="none" strokeWidth="4" />
          <circle cx="50" cy="50" r="11" fill="none" strokeWidth="4" />
          <path d="M50 39 A11 11 0 0 0 50 61 Z" />
          <circle cx="78" cy="50" r="11" />
        </g>
      );
    case "pentacle":
      return (
        <g fill="none" strokeWidth="5">
          <circle cx="50" cy="50" r="36" />
          <path d="M50 20 L67.6 74.3 L21.5 40.7 L78.5 40.7 L32.4 74.3 Z" />
        </g>
      );
    case "crystal":
      return (
        <g fill="none" strokeWidth="5">
          <path d="M50 14 L72 40 L60 86 L40 86 L28 40 Z" />
          <path d="M28 40 L50 50 L72 40 M50 50 L50 86 M50 14 L50 50" strokeWidth="4" />
        </g>
      );
    case "cluster":
      return (
        <g fill="none" strokeWidth="4.5">
          <path d="M34 42 L44 56 L39 84 L27 84 L22 56 Z" />
          <path d="M62 28 L76 52 L69 84 L55 84 L50 52 Z" />
        </g>
      );
    case "eye":
      return (
        <g>
          <path d="M14 50 Q50 22 86 50 Q50 78 14 50 Z" fill="none" strokeWidth="5" />
          <circle cx="50" cy="50" r="11" fill="none" strokeWidth="5" />
          <circle cx="50" cy="50" r="4" />
        </g>
      );
    case "flame":
      return (
        <path d="M50 12 C66 34 74 44 74 58 A24 24 0 1 1 26 58 C26 46 38 42 44 28 C47 38 42 48 52 52 C60 46 58 32 50 12 Z" />
      );
    case "leaf":
      return (
        <g fill="none" strokeWidth="5">
          <path d="M50 14 C76 28 76 64 50 86 C24 64 24 28 50 14 Z" />
          <path d="M50 22 L50 80" strokeWidth="4" />
        </g>
      );
    case "mountain":
      return (
        <g>
          <path
            d="M12 80 L38 38 L54 62 L66 42 L88 80 Z"
            fill="none"
            strokeWidth="5"
          />
          <circle cx="70" cy="28" r="7" />
        </g>
      );
    case "wave":
      return (
        <g fill="none" strokeWidth="5">
          <path d="M14 46 Q28 34 42 46 Q56 58 70 46 Q84 34 92 46" />
          <path d="M14 64 Q28 52 42 64 Q56 76 70 64 Q84 52 92 64" />
        </g>
      );
    case "bolt":
      return <path d="M56 10 L28 54 L46 54 L40 90 L74 40 L54 40 L64 10 Z" />;
    case "heart":
      return (
        <path d="M50 84 C16 60 14 34 33 25 C45 19 50 30 50 36 C50 30 55 19 67 25 C86 34 84 60 50 84 Z" />
      );
    case "key":
      return (
        <g fill="none" strokeWidth="5">
          <circle cx="36" cy="36" r="18" />
          <circle cx="36" cy="36" r="6" strokeWidth="4" />
          <path d="M49 49 L80 80 M72 72 L82 62 M64 64 L74 54" strokeWidth="5" />
        </g>
      );
    case "droplet":
      return (
        <path d="M50 14 C68 42 76 56 76 66 A26 26 0 1 1 24 66 C24 56 32 42 50 14 Z" />
      );
    case "comet":
      return (
        <g>
          <circle cx="66" cy="34" r="12" />
          <path
            d="M56 42 L20 80 M60 48 L30 84 M50 44 L22 66"
            fill="none"
            strokeWidth="5"
          />
        </g>
      );
    case "spiral":
      return (
        <path
          d="M50 50 C50 43 59 43 59 52 C59 65 41 65 41 47 C41 28 68 28 68 55 C68 85 28 85 28 44"
          fill="none"
          strokeWidth="5"
        />
      );
    case "feather":
      return (
        <g fill="none" strokeWidth="5">
          <path d="M68 18 C42 38 30 64 24 86" />
          <g strokeWidth="3">
            <path d="M58 30 L44 25" />
            <path d="M50 42 L34 39" />
            <path d="M42 55 L26 55" />
            <path d="M61 27 L68 16" />
            <path d="M53 39 L62 31" />
            <path d="M45 53 L56 47" />
          </g>
        </g>
      );
    case "snake":
      return (
        <g>
          <path
            d="M30 22 C60 22 60 46 38 52 C16 58 16 82 46 82"
            fill="none"
            strokeWidth="5"
          />
          <circle cx="30" cy="22" r="4.5" />
        </g>
      );
    default:
      return (
        <path d="M50 14 L60 40 L88 42 L66 59 L74 86 L50 70 L26 86 L34 59 L12 42 L40 40 Z" />
      );
  }
}

/** Renders a mystical symbol by id; falls back to a star. */
export function Motif({
  id,
  className,
}: {
  id?: string | null;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block", className)}
      aria-hidden
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {renderSymbol(id || "star")}
    </svg>
  );
}
