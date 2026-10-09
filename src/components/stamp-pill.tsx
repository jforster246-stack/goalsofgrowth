import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Stamp } from "@/components/stamp";
import { stampBalanceQueryOptions } from "@/lib/goal-queries";

/**
 * The stamp-count pill shown top-right on Home, Goals and Habits. Shows the
 * spendable balance and opens the Gallery page, where the collection lives.
 */
export function StampPill() {
  const { data: balance } = useQuery(stampBalanceQueryOptions);
  const count = balance?.balance ?? 0;

  return (
    <Link
      to="/gallery"
      aria-label={`${count} stamps to spend — open gallery`}
      title="Your stamps"
      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <Stamp icon={null} accent="sea" className="size-5" />
      <span className="font-mono text-sm text-olive">{count}</span>
    </Link>
  );
}
