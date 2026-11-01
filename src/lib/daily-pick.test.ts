import { describe, test } from "node:test";
import { deepStrictEqual, notStrictEqual } from "node:assert";
import { dailyPick } from "./daily-pick";

const goals = Array.from({ length: 11 }, (_, i) => ({ id: `goal-${i}` }));
const wins = Array.from({ length: 7 }, (_, i) => ({ id: `win-${i}` }));
const id = (g: { id: string }) => g.id;
const day = (d: number) => `2026-11-${String(d).padStart(2, "0")}`;

describe("dailyPick", () => {
  test("gives the same two goals all day, whatever order they load in", () => {
    const a = dailyPick(goals, day(2), id, 2).map(id);
    const b = dailyPick([...goals].reverse(), day(2), id, 2).map(id);
    deepStrictEqual(a, b);
  });

  test("never repeats yesterday's goals when there are enough", () => {
    for (let d = 2; d <= 29; d++) {
      const todayIds = dailyPick(goals, day(d), id, 2).map(id);
      const yIds = dailyPick(goals, day(d - 1), id, 2).map(id);
      deepStrictEqual(todayIds.filter((x) => yIds.includes(x)), []);
    }
  });

  test("shows a different win from one day to the next", () => {
    for (let d = 2; d <= 29; d++) {
      notStrictEqual(dailyPick(wins, day(d), id, 1)[0]!.id, dailyPick(wins, day(d - 1), id, 1)[0]!.id);
    }
  });
});
