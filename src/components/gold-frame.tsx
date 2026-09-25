import { cn } from "@/lib/utils";

// A gilded, beveled gold border - light picks out the top-left, shadow the
// bottom-right, so it reads as a real frame rather than a flat yellow box.
const GOLD_BORDER =
  "linear-gradient(135deg,#f9edc4 0%,#d9b563 20%,#a17f31 42%,#f0d98f 56%,#b9902f 74%,#7c5f1e 100%)";
const GOLD_INNER = "linear-gradient(135deg,#7c5f1e,#c9a44a)";

/**
 * A picture frame in gilded gold. Children fill the mount (a photo, a stamp, an
 * artwork placard, or an add button). Tapping it fires onClick.
 */
export function GoldFrame({
  children,
  onClick,
  ariaLabel,
  className,
  mountClassName,
}: {
  children: React.ReactNode;
  onClick?: (() => void) | undefined;
  ariaLabel?: string | undefined;
  className?: string | undefined;
  mountClassName?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "block w-full rounded-[10px] p-[7px] shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5",
        className,
      )}
      style={{ background: GOLD_BORDER }}
    >
      <span className="block rounded-[4px] p-px" style={{ background: GOLD_INNER }}>
        <span
          className={cn(
            "flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[3px]",
            mountClassName,
          )}
        >
          {children}
        </span>
      </span>
    </button>
  );
}
