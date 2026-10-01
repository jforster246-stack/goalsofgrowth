import { useQuery } from "@tanstack/react-query";
import { localToday } from "@/components/goal-ui";
import { goalsQueryOptions } from "@/lib/goal-queries";
import { cn } from "@/lib/utils";

function yesterdayOf(today: string): string {
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * "You ticked off N goal tasks yesterday, you're up to M today" — the goals
 * counterpart to the habit tally. Counts goal steps completed on each day.
 */
export function GoalTally({ className }: { className?: string }) {
  const today = localToday();
  const yesterday = yesterdayOf(today);
  const { data: goals } = useQuery(goalsQueryOptions);

  const steps = (goals ?? []).flatMap((g) => g.steps);
  const doneToday = steps.filter((s) => s.completed_on === today).length;
  const doneYesterday = steps.filter((s) => s.completed_on === yesterday).length;

  const plural = (n: number) => (n === 1 ? "task" : "tasks");

  return (
    <p
      className={cn(
        "rounded-2xl bg-white/60 px-4 py-3 font-serif text-sm leading-relaxed text-black/60",
        className,
      )}
    >
      You ticked off{" "}
      <span className="font-heading text-olive">{doneYesterday}</span> goal{" "}
      {plural(doneYesterday)} yesterday. You're up to{" "}
      <span className="font-heading text-olive">{doneToday}</span> today.{" "}
      {doneToday > doneYesterday
        ? "You've already beaten it — nice work!"
        : "See if you can beat it."}
    </p>
  );
}
