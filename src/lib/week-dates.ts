/** The seven YYYY-MM-DD dates (Monday → Sunday) of the week containing `day`. */
export function mondayWeek(day: string): string[] {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const base = Date.UTC(y, m - 1, d);
  const offset = (new Date(base).getUTCDay() + 6) % 7; // Monday = 0
  return Array.from({ length: 7 }, (_, i) =>
    new Date(base + (i - offset) * 86_400_000).toISOString().slice(0, 10),
  );
}
