import { test } from "node:test";
import { deepStrictEqual, notStrictEqual, rejects, strictEqual } from "node:assert";
import { createDraftQueue, resetCacheKey, resetDraftSchema } from "./planner-reset-draft";

test("account draft round-trip preserves the current step and unfinished answers", () => {
  const draft = resetDraftSchema.parse({
    step: 3, week: "2026-11-30", winText: "An unfinished win",
    audit: { "body.Physical health": 4 }, wins: ["Finished a project"],
    ev: { day: "2026-12-01", time: "12:30", title: "Unfinished event" },
    oooForm: { day: "2026-12-02", location: "Unfinished location" },
    awa: [{ day: "2026-12-03", slot: "awa", title: "Reading" }],
    myself: { day: "2026-12-05", text: "Time to relax" },
    reflect: { habits: "Habit reflection", routines: "Routine reflection" },
  });
  deepStrictEqual(resetDraftSchema.parse(JSON.parse(JSON.stringify(draft))), draft);
  strictEqual(draft.step, 3);
  strictEqual(draft.ev?.title, "Unfinished event");
  strictEqual(draft.winText, "An unfinished win");
});

test("local retry drafts are isolated by signed-in account", () => {
  notStrictEqual(resetCacheKey("first-account"), resetCacheKey("second-account"));
});

test("clearing a reset waits for all earlier account saves", async () => {
  const enqueue = createDraftQueue();
  const writes: string[] = [];
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const first = enqueue(async () => { await gate; writes.push("step 1"); });
  const latest = enqueue(async () => { writes.push("step 3"); });
  const clear = enqueue(async () => { writes.push("clear"); });
  release();
  await Promise.all([first, latest, clear]);
  deepStrictEqual(writes, ["step 1", "step 3", "clear"]);
});

test("a failed account save can be retried", async () => {
  const enqueue = createDraftQueue();
  await rejects(enqueue(async () => { throw new Error("Offline"); }));
  strictEqual(await enqueue(async () => "saved"), "saved");
});