import { goalProgress } from "@/components/goal-ui";

type StampRow = {
  id: string;
  goal_id: string | null;
  icon: string | null;
  accent: string;
  title: string;
  earned_at?: string | null;
};
type GoalLike = {
  id: string;
  title: string;
  accent: string;
  icon?: string | null;
  steps: { done: boolean }[];
};

export type StampView = {
  key: string;
  goalId: string | null;
  icon: string | null;
  accent: string;
  title: string;
  earnedAt: string | null;
};

/**
 * The stamps to show for completed goals: every stamp in the earned ledger,
 * plus any goal that's complete right now but has no ledger stamp yet (e.g.
 * finished before the stamp system existed). De-duplicated by goal.
 */
export function mergeStamps(
  stamps: StampRow[] | undefined,
  goals: GoalLike[] | undefined,
): StampView[] {
  const list = stamps ?? [];
  const seen = new Set(
    list.map((s) => s.goal_id).filter((x): x is string => !!x),
  );

  const fromLedger: StampView[] = list.map((s) => ({
    key: s.id,
    goalId: s.goal_id,
    icon: s.icon,
    accent: s.accent,
    title: s.title,
    earnedAt: s.earned_at ?? null,
  }));

  const fromGoals: StampView[] = (goals ?? [])
    .filter((g) => goalProgress(g).complete && !seen.has(g.id))
    .map((g) => ({
      key: g.id,
      goalId: g.id,
      icon: g.icon ?? null,
      accent: g.accent,
      title: g.title,
      earnedAt: null,
    }));

  return [...fromGoals, ...fromLedger];
}
