import { cn } from "@/lib/utils";

/**
 * The Moongrove celestial art set: minimal black-and-white line drawings
 * (Co-Star style). One SVG renderer for stars, moons, planets, suns, comets,
 * galaxies, nebulae and constellations, drawn in `currentColor` so the colour
 * comes from brand text styles. Used for collectibles and (later) goal icons.
 */
export type CelestialShape =
  | "star4"
  | "star5"
  | "starburst"
  | "supernova"
  | "crescent"
  | "halfmoon"
  | "fullmoon"
  | "eclipse"
  | "planet"
  | "ringed"
  | "gasgiant"
  | "iceworld"
  | "sun"
  | "comet"
  | "galaxy"
  | "nebula"
  | "orion"
  | "swan"
  | "bear";

const CONSTELLATIONS: Record<
  "orion" | "swan" | "bear",
  { pts: [number, number][]; lines: [number, number][] }
> = {
  orion: {
    pts: [
      [34, 24],
      [66, 28],
      [44, 52],
      [52, 54],
      [60, 52],
      [30, 80],
      [70, 78],
    ],
    lines: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
    ],
  },
  swan: {
    pts: [
      [50, 16],
      [50, 48],
      [50, 82],
      [26, 44],
      [74, 48],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [3, 1],
      [1, 4],
    ],
  },
  bear: {
    pts: [
      [44, 36],
      [60, 34],
      [64, 50],
      [46, 52],
      [34, 62],
      [24, 70],
      [14, 80],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
};

/** Evenly spaced rays from the centre, between radii r0 and r1. */
function rays(count: number, r0: number, r1: number) {
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    out.push({
      x1: 50 + Math.cos(a) * r0,
      y1: 50 + Math.sin(a) * r0,
      x2: 50 + Math.cos(a) * r1,
      y2: 50 + Math.sin(a) * r1,
    });
  }
  return out;
}

/** A small filled dot (stars in constellations, cores, craters). */
function Dot({ x, y, r }: { x: number; y: number; r: number }) {
  return <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />;
}

function Constellation({ name }: { name: "orion" | "swan" | "bear" }) {
  const c = CONSTELLATIONS[name];
  return (
    <g>
      {c.lines.map(([a, b], i) => (
        <line
          key={`l${i}`}
          x1={c.pts[a]![0]}
          y1={c.pts[a]![1]}
          x2={c.pts[b]![0]}
          y2={c.pts[b]![1]}
          strokeWidth="1.6"
        />
      ))}
      {c.pts.map(([x, y], i) => (
        <Dot key={`p${i}`} x={x} y={y} r={i % 3 === 0 ? 3 : 2.2} />
      ))}
    </g>
  );
}

function renderShape(shape: CelestialShape) {
  switch (shape) {
    case "star5":
      return (
        <path d="M50 16 L58.2 38.7 L82.3 39.5 L63.3 54.3 L70 77.5 L50 64 L30 77.5 L36.7 54.3 L17.7 39.5 L41.8 38.7 Z" />
      );
    case "star4":
      return (
        <path d="M50 14 C52 42 58 48 86 50 C58 52 52 58 50 86 C48 58 42 52 14 50 C42 48 48 42 50 14 Z" />
      );
    case "starburst":
      return (
        <g>
          {[0, 60, 120].map((deg, i) => {
            const a = (deg * Math.PI) / 180;
            const dx = Math.cos(a) * 20;
            const dy = Math.sin(a) * 20;
            return (
              <line
                key={i}
                x1={50 - dx}
                y1={50 - dy}
                x2={50 + dx}
                y2={50 + dy}
              />
            );
          })}
        </g>
      );
    case "supernova":
      return (
        <g>
          {[0, 45, 90, 135].map((deg, i) => {
            const a = (deg * Math.PI) / 180;
            const dx = Math.cos(a) * 34;
            const dy = Math.sin(a) * 34;
            return (
              <line
                key={i}
                x1={50 - dx}
                y1={50 - dy}
                x2={50 + dx}
                y2={50 + dy}
              />
            );
          })}
          <Dot x={50} y={50} r={4} />
        </g>
      );
    case "crescent":
      return (
        <path d="M62 22 A 32 32 0 1 0 62 78 A 24 24 0 1 1 62 22 Z" />
      );
    case "halfmoon":
      return (
        <g>
          <circle cx="50" cy="50" r="28" />
          <line x1="50" y1="22" x2="50" y2="78" />
        </g>
      );
    case "fullmoon":
      return (
        <g>
          <circle cx="50" cy="50" r="28" />
          <circle cx="42" cy="44" r="4" strokeWidth="1.6" />
          <circle cx="60" cy="56" r="5" strokeWidth="1.6" />
          <circle cx="47" cy="63" r="2.5" strokeWidth="1.6" />
        </g>
      );
    case "eclipse":
      return (
        <g>
          <circle cx="50" cy="50" r="24" />
          <circle cx="50" cy="50" r="16" strokeWidth="1.6" />
          {rays(8, 28, 35).map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} strokeWidth="1.6" />
          ))}
        </g>
      );
    case "planet":
      return (
        <g>
          <circle cx="50" cy="50" r="28" />
          <ellipse cx="50" cy="50" rx="28" ry="7" strokeWidth="1.6" />
        </g>
      );
    case "ringed":
      return (
        <g>
          <circle cx="50" cy="50" r="20" />
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="12"
            transform="rotate(-18 50 50)"
            strokeWidth="2"
          />
        </g>
      );
    case "gasgiant":
      return (
        <g>
          <circle cx="50" cy="50" r="28" />
          <line x1="23.8" y1="40" x2="76.2" y2="40" strokeWidth="1.6" />
          <line x1="22" y1="50" x2="78" y2="50" strokeWidth="1.6" />
          <line x1="23.8" y1="60" x2="76.2" y2="60" strokeWidth="1.6" />
        </g>
      );
    case "iceworld":
      return (
        <g>
          <circle cx="50" cy="50" r="28" />
          <line x1="30" y1="36" x2="70" y2="36" strokeWidth="1.6" />
          <line x1="30" y1="64" x2="70" y2="64" strokeWidth="1.6" />
        </g>
      );
    case "sun":
      return (
        <g>
          <circle cx="50" cy="50" r="16" />
          {rays(12, 22, 34).map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
          ))}
        </g>
      );
    case "comet":
      return (
        <g>
          <circle cx="64" cy="34" r="8" />
          <line x1="54" y1="38" x2="22" y2="62" strokeWidth="1.6" />
          <line x1="58" y1="42" x2="28" y2="74" strokeWidth="1.6" />
          <line x1="48" y1="44" x2="24" y2="68" strokeWidth="1.6" />
        </g>
      );
    case "galaxy":
      return (
        <g>
          <path d="M50 50 C 44 38 26 40 22 54 C 20 66 36 74 54 70" strokeWidth="2" />
          <path d="M50 50 C 56 62 74 60 78 46 C 80 34 64 26 46 30" strokeWidth="2" />
          <Dot x={50} y={50} r={3} />
        </g>
      );
    case "nebula":
      return (
        <g>
          <path
            d="M34 42 C 26 36 24 54 34 60 C 40 72 64 72 70 60 C 80 52 76 36 64 38 C 56 30 42 32 34 42 Z"
            strokeWidth="2"
          />
          <Dot x={44} y={50} r={1.8} />
          <Dot x={58} y={52} r={1.8} />
          <Dot x={50} y={60} r={1.5} />
        </g>
      );
    case "orion":
    case "swan":
    case "bear":
      return <Constellation name={shape} />;
    default:
      return null;
  }
}

export function CelestialBody({
  shape,
  className,
}: {
  shape: CelestialShape;
  /** Accepted for call-site compatibility; the line style is monochrome. */
  hue?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block h-full w-full", className)}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {renderShape(shape)}
    </svg>
  );
}
