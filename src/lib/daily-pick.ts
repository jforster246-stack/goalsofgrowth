/**
 * Day-seeded random picks: the same items all day, a fresh random mix the
 * next day. Each item is ranked by a hash of (day + its id), so the pick
 * stays put when other items are added, edited or ticked off.
 */

function hash(input: string): number {
  // FNV-1a, then a final avalanche mix so neighbouring days differ a lot.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Items in a random order that is fixed for `day` (YYYY-MM-DD). */
export function dailyShuffle<T>(items: readonly T[], day: string, idOf: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, rank: hash(`${day}|${idOf(item)}`) }))
    .sort((a, b) => a.rank - b.rank)
    .map((r) => r.item);
}

/** Picks before this day aren't tracked, so the chain below has a fixed start. */
const EPOCH = "2026-01-01";
const DAY_MS = 86_400_000;

function dayNumber(day: string): number {
  return Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

function dayString(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/**
 * `count` random items for `day`. When there are enough items to go round,
 * none of them repeats from the day before: each day is worked out in turn
 * from a fixed start date, skipping the previous day's picks.
 */
export function dailyPick<T>(
  items: readonly T[],
  day: string,
  idOf: (item: T) => string,
  count: number,
): T[] {
  if (items.length < count * 2) return dailyShuffle(items, day, idOf).slice(0, count);
  const target = dayNumber(day);
  let previous = new Set<string>();
  let picks: T[] = [];
  for (let n = Math.min(dayNumber(EPOCH), target); n <= target; n++) {
    picks = dailyShuffle(items, dayString(n), idOf)
      .filter((i) => !previous.has(idOf(i)))
      .slice(0, count);
    previous = new Set(picks.map(idOf));
  }
  return picks;
}
