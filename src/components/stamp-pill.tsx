import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stamp } from "@/components/stamp";
import { StampCollectionsModal } from "@/components/stamp-collections";
import {
  goalsQueryOptions,
  habitStampBonusQueryOptions,
  profileQueryOptions,
  stampsQueryOptions,
} from "@/lib/goal-queries";
import { mergeStamps } from "@/lib/stamp-view";

/**
 * The stamp-count pill shown top-right on Home, Goals and Habits. Tapping it
 * opens the stamp collections in a popup rather than navigating to a page.
 */
export function StampPill() {
  const [open, setOpen] = useState(false);
  const { data: stamps } = useQuery(stampsQueryOptions);
  const { data: goals } = useQuery(goalsQueryOptions);
  const { data: habitBonus } = useQuery(habitStampBonusQueryOptions);
  const { data: profile } = useQuery(profileQueryOptions);

  const count =
    mergeStamps(stamps, goals).length +
    (habitBonus ?? 0) +
    (profile?.bonus_stamps ?? 0);

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
