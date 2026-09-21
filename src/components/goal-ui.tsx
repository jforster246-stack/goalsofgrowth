import type { listGoals } from "@/lib/goals.functions";

export type GoalWithSteps = Awaited<ReturnType<typeof listGoals>>[number];

export const ACCENT_STYLES = {
  mint: { dot: "bg-mint", bar: "bg-mint", check: "fill-mint" },
  sea: { dot: "bg-sea", bar: "bg-sea", check: "fill-sea" },
  clay: { dot: "bg-clay", bar: "bg-clay", check: "fill-clay" },
} as const;

export type Accent = keyof typeof ACCENT_STYLES;

export function accentOf(goal: { accent: string }) {
  return ACCENT_STYLES[(goal.accent as Accent) ?? "mint"] ?? ACCENT_STYLES.mint;
}

/** Four-pointed diamond (sparkle) used for step checkboxes. */
export const DIAMOND_PATH =
  "M12 2.5c.55 4.35 3.1 6.9 7.5 7.5-4.4.6-6.95 3.15-7.5 7.5-.55-4.35-3.1-6.9-7.5-7.5 4.4-.6 6.95-3.15 7.5-7.5Z";

/** Six-pointed star with a hollow centre, used for the scattered background. */
const STAR_PATH =
  "M12 0.5 14.1 8.36 21.96 6.25 16.2 12 21.96 17.75 14.1 15.64 12 23.5 9.9 15.64 2.04 17.75 7.8 12 2.04 6.25 9.9 8.36Z M12 9.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z";

const SCATTERED_STARS = [
  { top: "6%", left: "8%", size: 56, delay: "0s", base: 0.55 },
  { top: "12%", left: "84%", size: 72, delay: "0.8s", base: 0.5 },
  { top: "22%", left: "58%", size: 44, delay: "1.6s", base: 0.45 },
  { top: "31%", left: "12%", size: 64, delay: "2.2s", base: 0.4 },
  { top: "44%", left: "90%", size: 48, delay: "0.4s", base: 0.5 },
  { top: "52%", left: "4%", size: 60, delay: "1.2s", base: 0.45 },
  { top: "63%", left: "76%", size: 68, delay: "2.8s", base: 0.4 },
  { top: "71%", left: "18%", size: 44, delay: "1.9s", base: 0.45 },
  { top: "82%", left: "66%", size: 56, delay: "0.6s", base: 0.5 },
  { top: "88%", left: "38%", size: 48, delay: "2.5s", base: 0.4 },
  { top: "16%", left: "32%", size: 36, delay: "3.1s", base: 0.45 },
  { top: "68%", left: "45%", size: 40, delay: "1.4s", base: 0.4 },
] as const;

export function StarField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {SCATTERED_STARS.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute fill-star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.base,
            ["--tw-base" as string]: s.base,
            animation: `twinkle 3.6s ease-in-out ${s.delay} infinite`,
          }}
        >
          <path d={STAR_PATH} fillRule="evenodd" />
        </svg>
      ))}
    </div>
  );
}

export function goalProgress(goal: GoalWithSteps) {
  const total = goal.steps.length;
  const done = goal.steps.filter((s) => s.done).length;
  return {
    total,
    done,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    complete: total > 0 && done === total,
    nextStep: goal.steps.find((s) => !s.done) ?? null,
  };
}

/** Local calendar date as YYYY-MM-DD (streaks follow the user's own day). */
export function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
