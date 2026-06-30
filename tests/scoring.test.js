import { describe, expect, test } from "vitest";
import { calculatePoints, updateDisplay, updateRecord, scoring } from "../src/scoring.js";

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

  test("hit records reaction time and increments hits and points", () => {
    scoring.reset();
    scoring.hit(300);
    scoring.hit(450);
    expect(scoring.points).toBe(2);
    expect(scoring.hits).toBe(2);
    const stats = scoring.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.avgReactionTime).toBe(375);
    expect(stats.bestReactionTime).toBe(300);
  });

  test("missclick increments missclick counter", () => {
    scoring.reset();
    scoring.missclick();
    scoring.missclick();
    scoring.missclick();
    expect(scoring.getStats().missclicks).toBe(3);
  });

  test("getStats returns correct stats after a round", () => {
    scoring.reset();
    scoring.hit(200);
    scoring.hit(400);
    scoring.missclick();
    const stats = scoring.getStats();
    expect(stats.points).toBe(2);
    expect(stats.hits).toBe(2);
    expect(stats.missclicks).toBe(1);
    expect(stats.bestReactionTime).toBe(200);
    expect(stats.avgReactionTime).toBe(300);
  });

  test("reset clears all stats", () => {
    scoring.hit(150);
    scoring.missclick();
    scoring.reset();
    const stats = scoring.getStats();
    expect(stats.points).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.missclicks).toBe(0);
    expect(stats.bestReactionTime).toBe(0);
    expect(stats.avgReactionTime).toBe(0);
  });
});