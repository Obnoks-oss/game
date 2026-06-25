/* @vitest-environment jsdom */
import { describe, expect, test, beforeAll } from "vitest";

let importError = null;

beforeAll(async () => {
  document.body.innerHTML = `
    <div class="container">
      <main class="spiel">
        <div class="anzeigen">
          <span id="punkte"></span>
          <span id="zeit"></span>
          <span id="rekord"></span>
        </div>
        <div class="spiel-panel">
          <section id="spielfeld">
            <button id="ziel"></button>
            <button class="bombe"></button>
            <button class="bombe"></button>
            <button class="bombe"></button>
          </section>
          <button id="start">Start</button>
        </div>
        <p id="meldung"></p>
      </main>
    </div>
  `;

  try {
    await import("../src/game.js");
  } catch (error) {
    importError = error;
  }
});

describe("game module", () => {
  test("game module loads without throwing", () => {
    expect(importError).toBeNull();
  });

  test("clicking the play surface starts the game", () => {
    const field = document.getElementById("spielfeld");
    const ziel = document.getElementById("ziel");
    const meldung = document.getElementById("meldung");

    field.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(ziel.style.display).toBe("block");
    expect(meldung.textContent).toContain("Los");
  });
});