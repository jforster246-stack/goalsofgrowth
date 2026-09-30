import { useQuery } from "@tanstack/react-query";
import { localToday } from "@/components/goal-ui";
import { habitsQueryOptions } from "@/lib/goal-queries";
import { cn } from "@/lib/utils";

function yesterdayOf(today: string): string {
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * "You did N habits yesterday, you're up to M today" — a nudge to keep the day
 * going. Counts the habits ticked off on each day.
 */
export function HabitTally({ className }: { className?: string }) {
  const today = localToday();
  const yesterday = yesterdayOf(today);
  const { data: todayHabits } = useQuery(habitsQueryOptions(today));
  const { data: yHabits } = useQuery(habitsQueryOptions(yesterday));

  const doneToday = (todayHabits ?? []).filter((h) => h.done).length;
  const doneYesterday = (yHabits ?? []).filter((h) => h.done).length;

  const plural = (n: number) => (n === 1 ? "habit" : "habits");

  return (
    <p
      className={cn(
        "rounded-2xl bg-white/60 px-4 py-3 font-serif text-sm leading-relaxed text-black/60",
        className,
      )}
    >
      You did a total of{" "}
      <span className="font-heading text-olive">{doneYesterday}</span>{" "}
      {plural(doneYesterday)} yesterday. You're up to{" "}
      <span className="font-heading text-olive">{doneToday}</span> today.{" "}
      {doneToday > doneYesterday
        ? "You've already beaten it — nice work!"
        : "See if you can beat it."}
    </p>
  );
}
