/* @vitest-environment jsdom */
import { describe, expect, test } from "vitest";
import { createFakeTargetButton } from "../src/ui.js";

describe("ui module", () => {
  test("createFakeTargetButton appends a button to the game field", () => {
    const gameField = document.createElement("div");

    const fakeTarget = createFakeTargetButton(gameField);

    expect(fakeTarget).toBeInstanceOf(HTMLButtonElement);
    expect(fakeTarget.className).toBe("fake-target");
    expect(fakeTarget.getAttribute("aria-label")).toBe("Fake target");
    expect(gameField.contains(fakeTarget)).toBe(true);
  });
});