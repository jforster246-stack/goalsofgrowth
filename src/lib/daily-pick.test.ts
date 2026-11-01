import { describe, expect, it } from "vitest";
import { dailyPick } from "./daily-pick";

const goals = Array.from({ length: 11 }, (_, i) => ({ id: `goal-${i}` }));
const id = (g: { id: string }) => g.id;

describe("dailyPick", () => {
  it("gives the same two goals all day", () => {
    const a = dailyPick(goals, "2026-11-02", id, 2).map(id);
    const b = dailyPick([...goals].reverse(), "2026-11-02", id, 2).map(id);
    expect(a).toEqual(b);
  });

  it("never repeats yesterday's two goals when there are enough", () => {
    for (let d = 1; d <= 28; d++) {
      const day = `2026-11-${String(d + 1).padStart(2, "0")}`;
      const yesterday = `2026-11-${String(d).padStart(2, "0")}`;
      const todayIds = dailyPick(goals, day, id, 2).map(id);
      const yIds = dailyPick(goals, yesterday, id, 2).map(id);
      expect(todayIds.filter((x) => yIds.includes(x))).toEqual([]);
    }
  });

  it("changes the win from one day to the next", () => {
    const wins = Array.from({ length: 7 }, (_, i) => ({ id: `win-${i}` }));
    for (let d = 1; d <= 28; d++) {
      const day = `2026-11-${String(d + 1).padStart(2, "0")}`;
      const yesterday = `2026-11-${String(d).padStart(2, "0")}`;
      expect(dailyPick(wins, day, id, 1)[0]!.id).not.toBe(dailyPick(wins, yesterday, id, 1)[0]!.id);
    }
  });
});
