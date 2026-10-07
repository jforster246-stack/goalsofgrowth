import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Armchair } from "lucide-react";
import { AwaLogModal, type AwaHobby } from "@/components/awa-log-modal";
import { awaHobbiesQueryOptions } from "@/lib/goal-queries";
import { cn } from "@/lib/utils";

/**
 * "What did you do today?" — a quick way to log a hobby activity straight from
 * the home dashboard, without opening the shelf.
 */
export function AwaQuickLog({ className }: { className?: string }) {
  const { data: hobbies } = useQuery(awaHobbiesQueryOptions);
  const [open, setOpen] = useState(false);
  const list = (hobbies ?? []) as AwaHobby[];

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm",
          className,
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage/20 text-olive">
          <Armchair className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm text-black">What did you do today?</p>
          <p className="font-serif text-xs text-black/45">
            Log a hobby in a few seconds.
          </p>
        </div>
        {list.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full bg-olive px-4 py-2 font-heading text-xs uppercase text-white transition-colors hover:bg-olive/90"
          >
            Log
          </button>
        ) : (
          <Link
            to="/awa"
            className="shrink-0 rounded-full bg-olive/10 px-4 py-2 font-heading text-xs uppercase text-olive transition-colors hover:bg-olive/20"
          >
            Shelf
          </Link>
        )}
      </div>
      {open && <AwaLogModal hobbies={list} onClose={() => setOpen(false)} />}
    </>
  );
}
