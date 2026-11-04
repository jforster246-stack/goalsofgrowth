import { describe, expect, it } from "vitest";
import { COURSES, completedLessons } from "./curriculum-data";

const course = COURSES[0]!;
const first = course.lessons[0]!.facts.length;

describe("completedLessons", () => {
  it("is empty with nothing revealed", () => {
    expect(completedLessons(course, 0)).toEqual([]);
  });
  it("includes a lesson once all its facts are revealed", () => {
    expect(completedLessons(course, first).map((l) => l.title)).toEqual([course.lessons[0]!.title]);
  });
  it("leaves out a partly revealed lesson", () => {
    expect(completedLessons(course, first + 1)).toHaveLength(1);
    expect(completedLessons(course, first - 1)).toHaveLength(0);
  });
});
