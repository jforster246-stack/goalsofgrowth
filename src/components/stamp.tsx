import { accentOf, STAR_PATH } from "@/components/goal-ui";
import { Motif } from "@/components/motif-icons";
import { cn } from "@/lib/utils";

/**
 * A collectible stamp earned by completing a goal: a coloured stamp body with
 * a dashed inner frame and the goal's chosen icon (or a star) in the middle.
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
  return (
    <div
      className={cn(
        "grid place-items-center rounded-md p-1.5 shadow-sm",
        a.surface,
        className ?? "size-16",
      )}
    >
      <div
        className={cn(
          "grid size-full place-items-center rounded-[3px] border border-dashed border-current bg-white",
          a.text,
        )}
      >
        {icon ? (
          <Motif id={icon} className="size-3/5" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-3/5 fill-current" aria-hidden>
            <path d={STAR_PATH} fillRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}
