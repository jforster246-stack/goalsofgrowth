import { STAMP_FRAME } from "@/components/stamp-frame";
import { cn } from "@/lib/utils";

/**
 * A small stamp-shaped marker: the stamp silhouette filled with the current
 * text colour, with optional content (a tick or a date number) centred on top.
 * Replaces the round day-dots used in streaks and the weekly habit strip.
 */
export function StampMark({
  children,
  className,
  outline = false,
}: {
  children?: React.ReactNode;
  className?: string | undefined;
  /** Draw just the stamp outline instead of a solid fill. */
  outline?: boolean;
}) {
  return (
    <span className={cn("relative inline-grid place-items-center", className)}>
      <svg
        viewBox={STAMP_FRAME.viewBox}
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <path
          d={STAMP_FRAME.d}
          transform={STAMP_FRAME.transform}
          fill={outline ? "none" : "currentColor"}
          stroke={outline ? "currentColor" : "none"}
          strokeWidth={outline ? 320 : 0}
          strokeLinejoin="round"
        />
      </svg>
      {children != null && <span className="relative z-10">{children}</span>}
    </span>
  );
}
