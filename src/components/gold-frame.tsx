import { frameFor } from "@/lib/frames-data";
import { cn } from "@/lib/utils";

/**
 * A picture in an ornate gold frame. A frame is picked at random (but stable)
 * from `seed`; the content is mounted inside the frame's window and the frame
 * image is laid over the top so its opening mattes the picture.
 */
export function GoldFrame({
  children,
  seed,
  onClick,
  ariaLabel,
  className,
  mountClassName,
}: {
  children: React.ReactNode;
  seed: string;
  onClick?: (() => void) | undefined;
  ariaLabel?: string | undefined;
  className?: string | undefined;
  mountClassName?: string | undefined;
}) {
  const frame = frameFor(seed);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "block w-full transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <span
        className="relative block w-full"
        style={{ aspectRatio: String(frame.ar) }}
      >
        <span
          className={cn(
            "absolute flex items-center justify-center overflow-hidden",
            mountClassName,
          )}
          style={{
            left: `${frame.inset.l * 100}%`,
            right: `${frame.inset.r * 100}%`,
            top: `${frame.inset.t * 100}%`,
            bottom: `${frame.inset.b * 100}%`,
            borderRadius: frame.radius,
          }}
        >
          {children}
        </span>
        <img
          src={frame.src}
          alt=""
          aria-hidden
          loading="lazy"
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full select-none"
        />
      </span>
    </button>
  );
}
