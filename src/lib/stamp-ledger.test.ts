import { describe, expect, test } from "bun:test";
import { uniqueGoalStamps } from "./stamp-ledger";

describe("completed goal stamps", () => {
  test("one completed goal has exactly one stamp even after repeat awards", () => {
    const original = { id: "original", goal_id: "completed-goal" };
    expect(uniqueGoalStamps([original, { id: "repeat", goal_id: "completed-goal" }]))
      .toEqual([original]);
  });

  test("different goals with the same title each keep their own stamp", () => {
    const rows = [
      { goal_id: "first-goal", title: "Same title" },
      { goal_id: "second-goal", title: "Same title" },
    ];
    expect(uniqueGoalStamps(rows)).toHaveLength(2);
  });

  test("standalone stamps without a goal remain separate", () => {
    expect(uniqueGoalStamps([{ goal_id: null }, { goal_id: null }])).toHaveLength(2);
  });
});