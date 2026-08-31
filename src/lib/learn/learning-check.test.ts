import { describe, expect, it } from "vitest";
import { checkLearningAnswer } from "./learning-check";

describe("checkLearningAnswer", () => {
  it("matches words without regard to case or punctuation", () => {
    expect(
      checkLearningAnswer("It uses REACT, often.", "React uses components."),
    ).toEqual({
      matched: ["react", "uses"],
      answerWordCount: 3,
      hasMatch: true,
    });
  });

  it("does not count partial words", () => {
    expect(
      checkLearningAnswer("component", "components compose interfaces"),
    ).toEqual({
      matched: [],
      answerWordCount: 3,
      hasMatch: false,
    });
  });

  it("counts repeated answer words once", () => {
    expect(checkLearningAnswer("test", "Test, test, test.")).toEqual({
      matched: ["test"],
      answerWordCount: 1,
      hasMatch: true,
    });
  });
});
