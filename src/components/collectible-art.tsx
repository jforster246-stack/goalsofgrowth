import { MysticalSymbol } from "@/components/motif-icons";
import type { Constellation } from "@/components/constellations-data";
import type { TarotCardData } from "@/components/tarot-data";
import { cn } from "@/lib/utils";

/** A constellation collectible: its star-line asterism, drawn in currentColor. */
export function ConstellationArt({
  c,
  className,
}: {
  c: Constellation;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block h-full w-full", className)}
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
          strokeOpacity="0.6"
        />
      ))}
      {c.stars.map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r="2.6" fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}

/**
 * A tarot collectible: an original minimal card — inked double frame, roman
 * numeral, a central mystical emblem, and the card name. Colour from currentColor.
 */
export function TarotCard({ card }: { card: TarotCardData }) {
  return (
    <div className="flex h-full w-full items-center justify-center text-current">
      <div className="relative flex aspect-[3/4] h-full flex-col items-center justify-between rounded-md p-[6%] ring-1 ring-current">
        <div className="pointer-events-none absolute inset-[4%] rounded-sm ring-1 ring-current/40" />
        <span className="font-serif text-[9px] leading-none">{card.num}</span>
        <MysticalSymbol id={card.emblem} className="h-[46%] w-[46%]" />
        <span className="px-0.5 text-center font-heading text-[6.5px] uppercase leading-tight tracking-wide">
          {card.name}
        </span>
      </div>
    </div>
  );
}
