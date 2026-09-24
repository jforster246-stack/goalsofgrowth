import { MOTIF_DATA } from "@/components/motif-data";
import { cn } from "@/lib/utils";

/**
 * The hand-drawn motif pack, used as selectable icons for goals and habits.
 * The shapes live in the generated `motif-data.ts`; here we expose the pick
 * list, a lookup, and a renderer that tints each motif with currentColor.
 */
export type Motif = { id: string; label: string };

export const MOTIFS: Motif[] = MOTIF_DATA.map((m, i) => ({
  id: m.id,
  label: `Motif ${i + 1}`,
}));

const MOTIF_MAP = new Map(MOTIF_DATA.map((m) => [m.id, m]));

/** Default habit icon by time of day (sun / tree / moon from the pack). */
export const TIME_MOTIF = {
  morning: "m027", // sun
  afternoon: "m010", // tree
  evening: "m057", // moon
} as const;

/** Renders a motif by id; returns null if the id is unknown. */
export function Motif({
  id,
  className,
}: {
  id?: string | null;
  className?: string;
}) {
  const m = id ? MOTIF_MAP.get(id) : undefined;
  if (!m) return null;
  return (
    <svg
      viewBox={m.viewBox}
      className={cn("fill-current", className)}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: m.inner }}
    />
  );
}
