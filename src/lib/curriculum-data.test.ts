import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { COURSES, completedLessons } from "./curriculum-data";

const course = COURSES[0]!;
const first = course.lessons[0]!.facts.length;

describe("completedLessons", () => {
  test("is empty with nothing revealed", () => {
    deepStrictEqual(completedLessons(course, 0), []);
  });
  test("includes a lesson once all its facts are revealed", () => {
    deepStrictEqual(
      completedLessons(course, first).map((l) => l.title),
      [course.lessons[0]!.title],
    );
  });
  test("leaves out a partly revealed lesson", () => {
    strictEqual(completedLessons(course, first + 1).length, 1);
    strictEqual(completedLessons(course, first - 1).length, 0);
  });
});
