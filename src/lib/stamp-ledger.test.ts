import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { uniqueGoalStamps } from "./stamp-ledger";

describe("completed goal stamps", () => {
  test("one completed goal has exactly one stamp even after repeat awards", () => {
    const original = { id: "original", goal_id: "completed-goal" };
    deepStrictEqual(uniqueGoalStamps([original, { id: "repeat", goal_id: "completed-goal" }]), [original]);
  });

  test("different goals with the same title each keep their own stamp", () => {
    const rows = [
      { goal_id: "first-goal", title: "Same title" },
      { goal_id: "second-goal", title: "Same title" },
    ];
    strictEqual(uniqueGoalStamps(rows).length, 2);
  });

  test("standalone stamps without a goal remain separate", () => {
    strictEqual(uniqueGoalStamps([{ goal_id: null }, { goal_id: null }]).length, 2);
  });
});