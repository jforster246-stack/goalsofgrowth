import { test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { mondayWeek } from "./week-dates";

test("a Wednesday's week runs Monday to Sunday", () => {
  deepStrictEqual(mondayWeek("2026-11-04"), [
    "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08",
  ]);
});
test("a Sunday belongs to the week that started the Monday before", () => {
  deepStrictEqual(mondayWeek("2026-11-08")[0], "2026-11-02");
});
test("a Monday starts its own week", () => {
  deepStrictEqual(mondayWeek("2026-11-02")[0], "2026-11-02");
});
