import { useId, type ReactNode } from "react";
import { accentOf, STAR_PATH } from "@/components/goal-ui";
import { MOTIF_DATA } from "@/components/motif-data";
import { STAMP_FRAME } from "@/components/stamp-frame";
import { cn } from "@/lib/utils";

const MOTIF_MAP = new Map(MOTIF_DATA.map((m) => [m.id, m]));

// Where (and how big) the cut-out icon sits inside the stamp silhouette.
const ICON_BOX = 360;
const ICON_CX = 380;
const ICON_CY = 372;

/**
 * A collectible stamp: the hand-drawn stamp silhouette filled with the goal's
 * accent colour, with the chosen icon (or a star) cut out of the middle.
 */
export function Stamp({
  icon,
  accent,
  className,
}: {
  icon?: string | null;
  accent: string;
  className?: string;
}) {
  const a = accentOf({ accent });
  const maskId = `stamp-${useId().replace(/:/g, "")}`;

  // The icon punched out of the stamp (black in the mask = hole).
  let cutout: ReactNode;
  const motif = icon ? MOTIF_MAP.get(icon) : undefined;
  if (motif) {
    const [, , w = 24, h = 24] = motif.viewBox.split(/\s+/).map(Number);
    const s = ICON_BOX / Math.max(w, h);
    const tx = ICON_CX - (w * s) / 2;
    const ty = ICON_CY - (h * s) / 2;
    cutout = (
      <g
        transform={`translate(${tx} ${ty}) scale(${s})`}
        style={{ color: "#000" }}
        dangerouslySetInnerHTML={{ __html: motif.inner }}
      />
    );
  } else {
    const s = ICON_BOX / 24;
    cutout = (
      <g transform={`translate(${ICON_CX - 12 * s} ${ICON_CY - 12 * s}) scale(${s})`}>
        <path d={STAR_PATH} fill="#000" fillRule="evenodd" />
      </g>
    );
  }

  return (
    <svg
      viewBox={STAMP_FRAME.viewBox}
      className={cn(a.text, className ?? "size-16")}
      aria-hidden
    >
      <mask id={maskId}>
        <g transform={STAMP_FRAME.transform}>
          <path d={STAMP_FRAME.d} fill="#fff" fillRule="evenodd" />
        </g>
        {cutout}
      </mask>
      <rect
        x="0"
        y="0"
        width="760"
        height="752"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
