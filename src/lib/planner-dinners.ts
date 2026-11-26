export type DinnerRow = { id: string; day: string; slot: string; title: string };

export type DinnerOp =
  | { kind: "add"; day: string; title: string }
  | { kind: "rename"; id: string; title: string }
  | { kind: "delete"; id: string };

/**
 * Work out what to write for the week's dinners.
 * One dinner per day: clearing a day's box removes that night's dinners,
 * typing in an empty day adds one, and changing the text renames the first one.
 * Days the editor never showed are left untouched.
 */
export function dinnerOps(days: string[], rows: DinnerRow[], values: Record<string, string>): DinnerOp[] {
  const ops: DinnerOp[] = [];
  for (const day of days) {
    if (!(day in values)) continue;
    const text = (values[day] ?? "").trim();
    const existing = rows.filter((r) => r.day === day && r.slot === "dinner");
    if (!text) {
      for (const r of existing) ops.push({ kind: "delete", id: r.id });
    } else if (!existing.length) {
      ops.push({ kind: "add", day, title: text });
    } else {
      const first = existing[0];
      if (first && first.title !== text) ops.push({ kind: "rename", id: first.id, title: text });
    }
  }
  return ops;
}
