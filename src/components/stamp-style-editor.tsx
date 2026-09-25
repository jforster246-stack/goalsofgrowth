import { Check } from "lucide-react";
import { GOAL_ACCENTS } from "@/components/goal-ui";
import { IconPicker } from "@/components/icon-picker";
import { cn } from "@/lib/utils";

/** Colour swatches + icon picker for how a stamp shows in the gallery. */
export function StampStyleEditor({
  icon,
  accent,
  onIcon,
  onAccent,
  defaultLabel = "Star",
}: {
  icon: string | null;
  accent: string;
  onIcon: (icon: string | null) => void;
  onAccent: (accent: string) => void;
  defaultLabel?: string;
}) {
  return (
    <div>
      <p className="font-heading text-sm uppercase text-olive">Colour</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {GOAL_ACCENTS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => onAccent(a.key)}
            aria-label={a.label}
            aria-pressed={accent === a.key}
            className={cn(
              "grid size-10 place-items-center rounded-full text-white transition-transform",
              a.swatch,
              accent === a.key
                ? "ring-2 ring-black/40 ring-offset-2 ring-offset-background"
                : "",
            )}
          >
            {accent === a.key && <Check className="size-5" strokeWidth={2.5} />}
          </button>
        ))}
      </div>

      <p className="mt-4 font-heading text-sm uppercase text-olive">Icon</p>
      <div className="mt-2">
        <IconPicker value={icon} onChange={onIcon} defaultLabel={defaultLabel} />
      </div>
    </div>
  );
}
