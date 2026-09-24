import { MOTIFS, Motif } from "@/components/motif-icons";
import { cn } from "@/lib/utils";

/**
 * A grid of selectable motif icons plus a "Default" option (clears the icon so
 * the context falls back to its own default — a star for goals, the time-of-day
 * icon for habits).
 */
export function IconPicker({
  value,
  onChange,
  defaultLabel = "Default",
}: {
  value?: string | null;
  onChange: (id: string | null) => void;
  defaultLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={!value}
        className={cn(
          "grid h-10 place-items-center rounded-xl px-3 font-heading text-xs uppercase transition-colors",
          !value
            ? "bg-olive text-white"
            : "bg-black/5 text-black/60 hover:bg-black/10",
        )}
      >
        {defaultLabel}
      </button>
      {MOTIFS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={value === m.id}
          aria-label={m.label}
          title={m.label}
          className={cn(
            "grid size-10 place-items-center rounded-xl transition-colors",
            value === m.id
              ? "bg-olive text-white"
              : "bg-black/5 text-olive hover:bg-black/10",
          )}
        >
          <Motif id={m.id} className="size-6" />
        </button>
      ))}
    </div>
  );
}
