import { describe, expect, test } from "vitest";
import { calculatePoints, updateDisplay, updateRecord } from "../src/scoring.js";

import {
  calculatePoints,
  updateDisplay,
  updateRecord
} from "../src/scoring.js";

describe("scoring module", () => {
  test("updateRecord returns new record when points are higher", () => {
    expect(updateRecord(10, 5)).toBe(10);
  });

  test("updateRecord returns existing record when points are lower", () => {
    expect(updateRecord(4, 7)).toBe(7);
  });

  test("calculatePoints adds one point normally", () => {
    expect(calculatePoints(3)).toBe(4);
  });

  test("calculatePoints gives a bonus on the fifth, tenth and fifteenth hit", () => {
    expect(calculatePoints(4)).toBe(6);
    expect(calculatePoints(9)).toBe(11);
    expect(calculatePoints(14)).toBe(16);
  });

  test("updateDisplay updates DOM element text content", () => {
    const pointsDisplay = { textContent: "" };
    const timeDisplay = { textContent: "" };
    const recordDisplay = { textContent: "" };

    updateDisplay({
      pointsDisplay,
      timeDisplay,
      recordDisplay,
      points: 8,
      remainingTime: 14,
      record: 20,
    });

    expect(pointsDisplay.textContent).toBe(8);
    expect(timeDisplay.textContent).toBe(14);
    expect(recordDisplay.textContent).toBe(20);
  });
});

test("calculatePoints adds one point normally", () => {
  expect(calculatePoints(3)).toBe(4);
});
 
test("calculatePoints adds a bonus point on every fifth hit", () => {
  expect(calculatePoints(4)).toBe(6);
});