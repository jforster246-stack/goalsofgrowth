/** Preserve standalone stamps, but count each linked goal only once. */
export function uniqueGoalStamps<T extends { goal_id: string | null }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (!row.goal_id) return true;
    if (seen.has(row.goal_id)) return false;
    seen.add(row.goal_id);
    return true;
  });
}