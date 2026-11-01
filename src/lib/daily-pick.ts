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

/** `count` random items for `day`, avoiding yesterday's picks when there are enough to go round. */
export function dailyPick<T>(
  items: readonly T[],
  day: string,
  idOf: (item: T) => string,
  count: number,
): T[] {
  const today = dailyShuffle(items, day, idOf);
  if (items.length < count * 2) return today.slice(0, count);
  const yesterdayIds = new Set(
    dailyShuffle(items, previousDay(day), idOf)
      .slice(0, count)
      .map(idOf),
  );
  const fresh = today.filter((i) => !yesterdayIds.has(idOf(i)));
  return fresh.slice(0, count);
}

function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
