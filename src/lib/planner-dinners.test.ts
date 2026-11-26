import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { dinnerOps, type DinnerRow } from "./planner-dinners";

const days = ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"];
const row = (id: string, day: string, title: string): DinnerRow => ({ id, day, slot: "dinner", title });

describe("dinnerOps", () => {
  test("adds a trimmed dinner for a day that has none", () => {
    deepStrictEqual(dinnerOps(days, [], { [days[0]!]: "  Pasta  " }), [{ kind: "add", day: "2026-11-23", title: "Pasta" }]);
  });

  test("renames an existing dinner only when the text changed", () => {
    const rows = [row("a", days[1]!, "Curry")];
    deepStrictEqual(dinnerOps(days, rows, { [days[1]!]: "Curry" }), []);
    deepStrictEqual(dinnerOps(days, rows, { [days[1]!]: "Tacos" }), [{ kind: "rename", id: "a", title: "Tacos" }]);
  });

  test("deletes every dinner on a day whose box was cleared", () => {
    const rows = [row("a", days[2]!, "Curry"), row("b", days[2]!, "Soup")];
    deepStrictEqual(dinnerOps(days, rows, { [days[2]!]: "   " }), [{ kind: "delete", id: "a" }, { kind: "delete", id: "b" }]);
  });

  test("leaves days the editor did not show alone", () => {
    deepStrictEqual(dinnerOps(days, [row("a", days[3]!, "Curry")], {}), []);
  });

  test("ignores rows from other slots", () => {
    deepStrictEqual(dinnerOps(days, [{ id: "a", day: days[0]!, slot: "lunch", title: "Sandwich" }], { [days[0]!]: "" }), []);
  });
});
