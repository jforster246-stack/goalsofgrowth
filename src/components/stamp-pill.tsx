import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stamp } from "@/components/stamp";
import { StampCollectionsModal } from "@/components/stamp-collections";
import { stampBalanceQueryOptions } from "@/lib/goal-queries";

/**
 * The stamp-count pill shown top-right on Home, Goals and Habits. Shows the
 * spendable balance (same number as the gallery) and opens the collections in a
 * popup rather than navigating to a page.
 */
export function StampPill() {
  const [open, setOpen] = useState(false);
  const { data: balance } = useQuery(stampBalanceQueryOptions);
  const count = balance?.earned ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${count} stamps earned — view collection`}
        title="Your stamps"
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm transition-transform hover:-translate-y-0.5"
      >
        <Stamp icon={null} accent="sea" className="size-5" />
        <span className="font-mono text-sm text-olive">{count}</span>
      </button>
      {open && <StampCollectionsModal onClose={() => setOpen(false)} />}
    </>
  );
}
